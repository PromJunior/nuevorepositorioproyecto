from pydantic import BaseModel

class CategoryData(BaseModel):

    name_category: str
    

class CategoryResponse(CategoryData):

    id: int

    class Config:
        from_attributes = True
    
