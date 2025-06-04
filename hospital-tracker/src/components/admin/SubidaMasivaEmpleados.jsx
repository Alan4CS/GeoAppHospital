import { useState } from "react";
import { FileUp, Table, Upload, X } from "lucide-react";

export default function CsvUploader({ onCancelar }) {
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".csv")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split("\n").filter(Boolean);
      const parsedData = rows.map((row) => row.split(","));
      setCsvData(parsedData);
      setFileName(file.name);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <FileUp className="h-5 w-5 mr-2 text-blue-600" />
          Subir Archivo CSV
        </h2>
        <p className="text-gray-500 mt-1">
          Carga un archivo CSV para visualizar su contenido en la tabla.
        </p>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Upload className="h-4 w-4 mr-1 inline text-blue-600" />
            Selecciona un archivo CSV
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {fileName && (
            <p className="mt-2 text-sm text-gray-600">Archivo: {fileName}</p>
          )}
        </div>

        {csvData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 flex items-center mb-2">
              <Table className="h-4 w-4 mr-2 text-blue-600" />
              Vista previa del archivo
            </h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100 text-gray-700 font-semibold">
                  <tr>
                    {csvData[0].map((col, index) => (
                      <th key={index} className="px-4 py-2 text-left">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {csvData.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-2 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onCancelar}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
