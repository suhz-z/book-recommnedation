"""Handles embeddings generation and FAISS index management."""
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path


class EmbeddingService:
    """Manages embeddings and FAISS similarity search."""
    
    def __init__(self, model_name: str):
        self.model = SentenceTransformer(model_name)
        self.index = None
        self.embeddings = None
        self.ids = None
    
    @staticmethod
    def normalize(vectors: np.ndarray) -> np.ndarray:
        """L2 normalize vectors for cosine similarity via dot product."""
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        return vectors / norms
    
    def build_index(self, texts: list[str], ids: np.ndarray, save_path: Path) -> None:
        """Generate embeddings and build FAISS index."""
        # Generate embeddings
        embeddings = self.model.encode(
            texts, 
            show_progress_bar=True, 
            convert_to_numpy=True
        )
        
        # Normalize for cosine similarity
        self.embeddings = self.normalize(embeddings).astype('float32')
        self.ids = ids.astype(np.int64)
        
        # Build FAISS index (Inner Product on normalized = cosine similarity)
        dim = self.embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dim)
        self.index.add(self.embeddings)
        
        # Persist
        self._save(save_path)
    
    def load_index(
        self, 
        index_path: Path, 
        embeddings_path: Path, 
        ids_path: Path
    ) -> bool:
        """Load persisted FAISS index and metadata."""
        if not all(p.exists() for p in [index_path, embeddings_path, ids_path]):
            return False
        
        self.index = faiss.read_index(str(index_path))
        self.embeddings = np.load(embeddings_path).astype('float32')
        self.ids = np.load(ids_path).astype(np.int64)
        return True
    
    def search_similar(self, book_id: int, top_k: int = 10) -> list[tuple[int, float]]:
        """Find similar items using FAISS. Returns [(id, score), ...]."""
        # Find query vector index
        matches = np.where(self.ids == book_id)[0]
        if len(matches) == 0:
            return []
        
        query = self.embeddings[matches[0]].reshape(1, -1)
        k = min(len(self.ids), top_k + 1)
        
        # Search
        scores, indices = self.index.search(query, k)
        
        # Filter and format results
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
