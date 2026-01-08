import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Parse name in "LastName FirstName MiddleName..." format
function parseName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    // Format is "LastName FirstName MiddleName..."
    return { lastName: parts[0], firstName: parts.slice(1).join(" ") };
}

// Parse address like "123 Main St, City, State, 78000"
function parseAddress(address: string): { street: string; city: string; state: string; zipCode: string } {
    const parts = address.split(",").map((p) => p.trim());
    return {
        street: parts[0] || "",
        city: parts[1] || "",
        state: parts[2] || "",
        zipCode: parts[3] || "",
    };
}

// Parse CSV content
function parseCSV(content: string): Record<string, string>[] {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headers = parseCSVLine(lines[0]);
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || "";
        });
        rows.push(row);
    }

    return rows;
}

// Parse a single CSV line handling quoted values
function parseCSVLine(line: string): string[] {
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
}

export async function POST(request: NextRequest) {
    const session = (await auth()) as { user?: { id: string } } | null;
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const content = await file.text();
        const rows = parseCSV(content);

        if (rows.length === 0) {
            return NextResponse.json({ error: "No data found in CSV" }, { status: 400 });
        }

        const results = {
            total: rows.length,
            created: 0,
            skipped: 0,
            errors: [] as string[],
        };

        // Process in batches of 100
        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const leadsToCreate = [];

            for (const row of batch) {
                try {
                    const name = row["Name"] || "";
                    const address = row["Address"] || "";
                    const latitude = parseFloat(row["Latitude"]) || null;
                    const longitude = parseFloat(row["Longitude"]) || null;
                    const occupancyStatus = row["Occupancy_Status"] || "";
                    const occupancyReason = row["Occupancy_Reason"] || "";

                    if (!name) {
                        results.skipped++;
                        continue;
                    }

                    const { firstName, lastName } = parseName(name);
                    const { street, city, state, zipCode } = parseAddress(address);

                    leadsToCreate.push({
                        firstName,
                        lastName,
                        street,
                        city,
                        state,
                        zipCode,
                        latitude,
                        longitude,
                        source: occupancyStatus ? `${occupancyStatus}-Occupied` : null,
                        description: occupancyReason || null,
                        status: "NEW" as const,
                    });
                } catch (error) {
                    results.errors.push(`Row ${i + batch.indexOf(row) + 2}: ${error}`);
                    results.skipped++;
                }
            }

            if (leadsToCreate.length > 0) {
                const created = await prisma.lead.createMany({
                    data: leadsToCreate,
                    skipDuplicates: true,
                });
                results.created += created.count;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Imported ${results.created} leads`,
            details: results,
        });
    } catch (error) {
        console.error("Failed to import leads:", error);
        return NextResponse.json({ error: "Failed to import leads" }, { status: 500 });
    }
}
