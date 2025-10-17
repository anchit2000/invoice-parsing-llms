from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pdf2image import convert_from_bytes
import base64
from typing import List
import io

app = FastAPI(title="PDF to Base64 Image API")

@app.post("/pdf-to-images/", response_model=List[str])
async def pdf_to_images(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        # Read PDF bytes
        pdf_bytes = await file.read()

        # Convert PDF to images (list of PIL Images)
        images = convert_from_bytes(pdf_bytes, 
                                    # poppler_path=r"C:\\Users\\Thinkpad\\poppler-25.07.0\\Library\\bin"
                                    )

        # Convert images to base64
        base64_images = []
        for img in images:
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            base64_images.append(img_str)

        print(base64_images)

        return JSONResponse(content=base64_images)
    
    except Exception as e:
        import traceback as tb
        tb.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
