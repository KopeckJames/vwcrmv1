"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type ImportResult = {
    success: boolean;
    message: string;
    details: {
        total: number;
        created: number;
        skipped: number;
        errors: string[];
    };
};

type PreviewRow = Record<string, string>;

export default function ImportLeadsPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
                result.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    };

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setResult(null);

        // Read and preview first 5 rows
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).filter((line) => line.trim());

            if (lines.length < 2) {
                setError("CSV file must have a header row and at least one data row");
                return;
            }

            const headerRow = parseCSVLine(lines[0]);
            setHeaders(headerRow);

            const previewRows: PreviewRow[] = [];
            for (let i = 1; i < Math.min(6, lines.length); i++) {
                const values = parseCSVLine(lines[i]);
                const row: PreviewRow = {};
                headerRow.forEach((header, index) => {
                    row[header] = values[index] || "";
                });
                previewRows.push(row);
            }
            setPreview(previewRows);
        };
        reader.readAsText(selectedFile);
    }, []);

    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/leads/import", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Import failed");
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed");
        } finally {
            setIsUploading(false);
        }
    };

    const fieldMapping = [
        { csv: "Name", lead: "firstName, lastName", note: "Split by first space" },
        { csv: "Address", lead: "street, city, state, zipCode", note: "Split by commas" },
        { csv: "Latitude", lead: "latitude", note: "Direct mapping" },
        { csv: "Longitude", lead: "longitude", note: "Direct mapping" },
        { csv: "Occupancy_Status", lead: "source", note: "Stored as 'Owner-Occupied'" },
        { csv: "Occupancy_Reason", lead: "description", note: "Optional notes" },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Import Leads" />

            <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
                <div className="mb-6">
                    <Link href="/dashboard/leads" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Leads
                    </Link>
                </div>

                {result ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="flex justify-center mb-4">
                                {result.success ? (
                                    <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                                    </div>
                                ) : (
                                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <AlertCircle className="h-8 w-8 text-red-600" />
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{result.message}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                {result.details.created} leads created, {result.details.skipped} skipped
                            </p>
                            {result.details.errors.length > 0 && (
                                <div className="text-left bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6 max-h-40 overflow-auto">
                                    <p className="font-medium text-red-700 dark:text-red-400 mb-2">Errors:</p>
                                    {result.details.errors.slice(0, 5).map((err, i) => (
                                        <p key={i} className="text-sm text-red-600 dark:text-red-400">{err}</p>
                                    ))}
                                    {result.details.errors.length > 5 && (
                                        <p className="text-sm text-red-600 dark:text-red-400">...and {result.details.errors.length - 5} more</p>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-4 justify-center">
                                <Button variant="outline" onClick={() => { setResult(null); setFile(null); setPreview([]); }}>
                                    Import More
                                </Button>
                                <Button onClick={() => router.push("/dashboard/leads")}>View Leads</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {/* Upload Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Upload CSV File
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <FileSpreadsheet className="h-8 w-8 text-slate-400 mb-2" />
                                        {file ? (
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{file.name}</p>
                                        ) : (
                                            <>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    <span className="font-medium">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-slate-400">CSV files only</p>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileChange} />
                                </label>
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Field Mapping */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Field Mapping</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b dark:border-slate-700">
                                                <th className="text-left py-2 px-3">CSV Column</th>
                                                <th className="text-left py-2 px-3">Lead Field(s)</th>
                                                <th className="text-left py-2 px-3">Note</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fieldMapping.map((map, i) => (
                                                <tr key={i} className="border-b dark:border-slate-800">
                                                    <td className="py-2 px-3 font-mono text-xs">{map.csv}</td>
                                                    <td className="py-2 px-3 font-mono text-xs">{map.lead}</td>
                                                    <td className="py-2 px-3 text-slate-500">{map.note}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">
                                    Fields not mapped (email, phone, company, etc.) will be left blank for you to fill in.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Preview */}
                        {preview.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preview (First 5 Rows)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b dark:border-slate-700">
                                                    {headers.slice(0, 5).map((h, i) => (
                                                        <th key={i} className="text-left py-2 px-3 font-medium">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.map((row, i) => (
                                                    <tr key={i} className="border-b dark:border-slate-800">
                                                        {headers.slice(0, 5).map((h, j) => (
                                                            <td key={j} className="py-2 px-3 truncate max-w-[200px]">{row[h]}</td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Import Button */}
                        {file && preview.length > 0 && (
                            <div className="flex justify-end">
                                <Button onClick={handleImport} disabled={isUploading} size="lg">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Import Leads
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
