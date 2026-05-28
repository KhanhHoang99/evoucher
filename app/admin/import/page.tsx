"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminVoucherImportPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Kiểm tra quyền admin
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    if (!t || !u) { router.push("/login"); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== "ADMIN") { router.push("/login"); return; }
    setToken(t);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Vui lòng chọn file Excel trước khi import!");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/vouchers/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // ← Thêm token
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (err: any) {
      setResult({ success: false, error: "Lỗi kết nối đến server hệ thống." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        
        <div className="bg-orange-500 p-6 text-white">
          <h1 className="text-xl font-bold">Tạo Thẻ Voucher</h1>
          <p className="text-orange-100 text-sm mt-1">Phát hành & Import thẻ voucher hàng loạt từ Excel</p>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Chọn file Excel danh sách cấp thẻ (.xlsx)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-orange-400 transition-colors bg-gray-50">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                    <span>Tải file lên</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      accept=".xlsx, .xls" 
                      className="sr-only" 
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="pl-1">hoặc kéo thả vào đây</p>
                </div>
                <p className="text-xs text-gray-500">Định dạng file chấp nhận: .xlsx, .xls</p>
              </div>
            </div>
          </div>

          {file && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-2 rounded-lg flex items-center justify-between text-sm">
              <span className="truncate font-medium">📄 {file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-orange-500 hover:text-orange-700 font-bold">Xóa</button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý dữ liệu DB...
              </span>
            ) : "Xác nhận Import vào Hệ thống"}
          </button>

          {result && (
            <div className={`p-4 rounded-lg border text-sm ${result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
              {result.success ? (
                <div className="font-semibold">✅ Thành công: {result.message}</div>
              ) : (
                <div>
                  <span className="font-semibold">❌ Thất bại:</span> {result.error}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}