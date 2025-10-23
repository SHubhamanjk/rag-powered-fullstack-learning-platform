from pydantic import BaseModel, Field


class RewriteTextRequest(BaseModel):
    text: str = Field(..., description="Text to be rewritten")
    context: str = Field(
        default="general",
        description="Context for rewriting (e.g., 'note', 'todo', 'message')"
    )


class RewriteTextResponse(BaseModel):
    original_text: str
    rewritten_text: str
    improvement_applied: bool

