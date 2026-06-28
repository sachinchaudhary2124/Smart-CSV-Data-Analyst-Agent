class UploadModel:
    def __init__(
        self,
        upload_id: str,
        original_name: str,
        saved_name: str,
        upload_time: str,
        file_size: int,
        columns: list,
        rows: int,
        status: str = "ready"
    ):
        self.upload_id = upload_id
        self.original_name = original_name
        self.saved_name = saved_name
        self.upload_time = upload_time
        self.file_size = file_size
        self.columns = columns
        self.rows = rows
        self.status = status

    def to_dict(self) -> dict:
        return {
            "upload_id": self.upload_id,
            "original_name": self.original_name,
            "saved_name": self.saved_name,
            "upload_time": self.upload_time,
            "file_size": self.file_size,
            "columns": self.columns,
            "rows": self.rows,
            "status": self.status
        }
