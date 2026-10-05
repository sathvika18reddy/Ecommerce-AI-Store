import re
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

class TextPreprocessor:
    """
    Utility for cleaning and normalizing text data for content-based recommendation.
    """

    @staticmethod
    def clean_text(text: str) -> str:
        if not text or not isinstance(text, str):
            return ""
        # Lowercase, remove HTML tags, non-alphanumeric characters, and extra spaces
        text = text.lower()
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text

    @staticmethod
    def combine_product_features(products: List[Dict[str, Any]]) -> pd.DataFrame:
        """
        Converts product dictionary records into a DataFrame with consolidated feature text.
        """
        df = pd.DataFrame(products)
        if df.empty:
            return pd.DataFrame(columns=["id", "feature_text"])

        # Combine name and description into a single corpus text
        df["name_clean"] = df.get("name", "").apply(TextPreprocessor.clean_text)
        df["description_clean"] = df.get("description", "").apply(TextPreprocessor.clean_text)
        df["feature_text"] = df["name_clean"] + " " + df["description_clean"]

        return df[["id", "feature_text"]]
