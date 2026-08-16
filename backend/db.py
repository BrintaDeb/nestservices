"""MongoDB client + Pydantic base model with ObjectId <-> str coercion."""
from __future__ import annotations
import os
from typing import Annotated, Any, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field


def _to_str_id(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str):
        return v
    return str(v)


PyObjectId = Annotated[str, BeforeValidator(_to_str_id)]


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: dict | None):
        if not doc:
            return None
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
        return cls(**doc)

    def to_mongo(self, exclude_id: bool = True) -> dict:
        data = self.model_dump(by_alias=True, exclude_none=True)
        if exclude_id and "_id" in data:
            data.pop("_id", None)
        return data


_client: Optional[AsyncIOMotorClient] = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(os.environ["MONGO_URL"])
        _db = _client[os.environ["DB_NAME"]]
    return _db


def close_db():
    global _client
    if _client is not None:
        _client.close()
