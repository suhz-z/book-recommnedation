"""Embedding service for FAISS similarity search."""
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path
from typing import List, Tuple, Optional

class EmbeddingService:
    """Service for generating embeddings and FAISS similarity search."""
    
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)
        self.index: Optional[faiss.Index] = None
        self.embeddings: Optional[np.ndarray] = None
        self.ids: Optional[np.ndarray] = None
    
    @staticmethod
    def normalize(vectors: np.ndarray) -> np.ndarray:
        """L2 normalize vectors for cosine similarity."""
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return vectors / norms
    
    def build_index(self, texts: List[str], ids: np.ndarray, save_path: Path) -> None:
        """Generate embeddings and build FAISS index."""
        print(f"Building FAISS index for {len(texts)} items...")
        
        # Generate embeddings
        embeddings = self.model.encode(
            texts,
            batch_size=32,
            show_progress_bar=True,
            convert_to_numpy=True
        )
        
        # Normalize
        self.embeddings = self.normalize(embeddings).astype('float32')
        self.ids = ids.astype(np.int64)
        
        # Build FAISS index
        dim = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(self.embeddings)
        
        # Save
        self._save(save_path)
        print(f"FAISS index built and saved to {save_path}")
    
    def load_index(
        self,
        index_path: Path,
        embeddings_path: Path,
        ids_path: Path
    ) -> bool:
        """Load persisted FAISS index."""
        if not all(p.exists() for p in [index_path, embeddings_path, ids_path]):
            return False
        
        self.index = faiss.read_index(str(index_path))
        self.embeddings = np.load(embeddings_path).astype('float32')
        self.ids = np.load(ids_path).astype(np.int64)
        
        print(f"Loaded FAISS index with {len(self.ids)} items")
        return True
    
    def search_similar(self, book_id: int, top_k: int = 10) -> List[Tuple[int, float]]:
        """Find similar items using FAISS."""
        if self.index is None or self.embeddings is None or self.ids is None:
            return []
        
        matches = np.where(self.ids == book_id)[0]
        if len(matches) == 0:
            return []
        
        query = self.embeddings[matches[0]].reshape(1, -1)
        k = min(len(self.ids), top_k + 1)
        
        scores, indices = self.index.search(query, k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx == -1 or self.ids[idx] == book_id:
                continue
            results.append((int(self.ids[idx]), float(score)))
            if len(results) >= top_k:
                break
        
        return results
    
    def _save(self, base_path: Path) -> None:
        """Persist index and metadata."""
        faiss.write_index(self.index, str(base_path))
        np.save(str(base_path.parent / "embeddings.npy"), self.embeddings)
        np.save(str(base_path.parent / "ids.npy"), self.ids)
