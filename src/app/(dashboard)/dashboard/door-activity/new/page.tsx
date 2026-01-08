"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DoorOpen,
    MapPin,
    Save,
    Loader2,
    Package,
    UserCheck,
    XCircle,
    ThumbsUp,
    Calendar,
    AlertCircle,
    Ban,
    Camera,
} from "lucide-react";

const outcomes = [
    { value: "NO_ANSWER", label: "No Answer", icon: DoorOpen, color: "default" },
    { value: "LEFT_MATERIALS", label: "Left Materials", icon: Package, color: "info" },
    { value: "SPOKE_WITH_RESIDENT", label: "Spoke with Resident", icon: UserCheck, color: "secondary" },
    { value: "NOT_INTERESTED", label: "Not Interested", icon: XCircle, color: "warning" },
    { value: "INTERESTED", label: "Interested", icon: ThumbsUp, color: "success" },
    { value: "APPOINTMENT_SET", label: "Appointment Set", icon: Calendar, color: "success" },
    { value: "WRONG_ADDRESS", label: "Wrong Address", icon: AlertCircle, color: "warning" },
    { value: "DO_NOT_CONTACT", label: "Do Not Contact", icon: Ban, color: "danger" },
] as const;

const materialTypes = [
    "Door Knocker",
    "Flyer",
    "Brochure",
    "Business Card",
    "Door Hanger",
    "Product Sample",
    "Other",
];

export default function NewDoorActivityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [selectedOutcome, setSelectedOutcome] = useState<string>("");
    const [leftMaterials, setLeftMaterials] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<string>("");
    const [address, setAddress] = useState({
        street: "",
        city: "",
        state: "",
        zipCode: "",
    });
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    // Get current location on mount
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    setLocation({ lat, lng });
                    await reverseGeocode(lat, lng);
                },
                (err) => {
                    setLocationError("Unable to get your location. Please enable location services.");
                    console.error("Geolocation error:", err);
                },
                { enableHighAccuracy: true }
            );
        } else {
            setLocationError("Geolocation is not supported by your browser.");
        }
    }, []);

    async function reverseGeocode(lat: number, lng: number) {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();

            if (data.address) {
                const addr = data.address;
                const newAddress = {
                    street: `${addr.house_number || ""} ${addr.road || ""}`.trim(),
                    city: addr.city || addr.town || addr.village || "",
                    state: addr.state || "",
                    zipCode: addr.postcode || "",
                };
                setAddress(newAddress);
            }
        } catch (err) {
            console.error("Reverse geocoding error:", err);
        }
    }

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (!location) {
            setError("Location is required. Please enable location services.");
            return;
        }

        if (!selectedOutcome) {
            setError("Please select an outcome.");
            return;
        }

        if (leftMaterials && selectedMaterial === "Door Knocker" && !photo) {
            setError("A photo is required when placing a door knocker.");
            return;
        }

        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const data = {
            outcome: selectedOutcome,
            notes: formData.get("notes") || null,
            leftMaterials,
            materialsType: leftMaterials ? selectedMaterial : null,
            latitude: location.lat,
            longitude: location.lng,
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            photoUrl: photoPreview, // Sending base64 photo
        };

        try {
            const res = await fetch("/api/door-activity", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to log activity");
            }

            router.push("/dashboard/door-activity");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to log activity");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Log Door Activity" />

            <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {locationError && (
                        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-600 dark:text-amber-400">
                            {locationError}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Location Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Current Location
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {location ? (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Getting your location...
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Outcome Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>What happened?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3">
                                    {outcomes.map((outcome) => {
                                        const Icon = outcome.icon;
                                        const isSelected = selectedOutcome === outcome.value;
                                        return (
                                            <button
                                                key={outcome.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedOutcome(outcome.value);
                                                    if (outcome.value === "LEFT_MATERIALS" || outcome.value === "NO_ANSWER") {
                                                        setLeftMaterials(true);
                                                    }
                                                }}
                                                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${isSelected
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                                    }`}
                                            >
                                                <Icon className={`h-5 w-5 ${isSelected ? "text-blue-500" : "text-slate-400"}`} />
                                                <span className={`text-sm font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : ""}`}>
                                                    {outcome.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detected Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Verify Address</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="street">Street Address</Label>
                                        <input
                                            type="text"
                                            id="street"
                                            value={address.street}
                                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                            className="w-full p-2 border rounded-md dark:bg-slate-900"
                                            placeholder="123 Main St"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <input
                                                type="text"
                                                id="city"
                                                value={address.city}
                                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                                className="w-full p-2 border rounded-md dark:bg-slate-900"
                                                placeholder="City"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="state">State</Label>
                                            <input
                                                type="text"
                                                id="state"
                                                value={address.state}
                                                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                                                className="w-full p-2 border rounded-md dark:bg-slate-900"
                                                placeholder="TX"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zipCode">Zip</Label>
                                            <input
                                                type="text"
                                                id="zipCode"
                                                value={address.zipCode}
                                                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                                                className="w-full p-2 border rounded-md dark:bg-slate-900"
                                                placeholder="12345"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Materials Left */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Materials</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="leftMaterials"
                                        checked={leftMaterials}
                                        onChange={(e) => setLeftMaterials(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <Label htmlFor="leftMaterials">Left marketing materials</Label>
                                </div>

                                {leftMaterials && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="materialsType">Material Type</Label>
                                            <Select
                                                value={selectedMaterial}
                                                onValueChange={(val) => setSelectedMaterial(val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select material type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {materialTypes.map((type) => (
                                                        <SelectItem key={type} value={type}>
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selectedMaterial === "Door Knocker" && (
                                            <div className="space-y-3 pt-2">
                                                <Label className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                                                    <Camera className="h-4 w-4" />
                                                    Photo Required: Snap the door knocker
                                                </Label>

                                                <div className="flex flex-col gap-4">
                                                    {photoPreview ? (
                                                        <div className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100 dark:bg-slate-800">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={photoPreview}
                                                                alt="Preview"
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                className="absolute bottom-2 right-2"
                                                                onClick={() => {
                                                                    setPhoto(null);
                                                                    setPhotoPreview(null);
                                                                }}
                                                            >
                                                                Retake
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <Camera className="w-8 h-8 mb-3 text-slate-400" />
                                                                <p className="text-sm text-slate-500">Tap to take a photo</p>
                                                            </div>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="image/*"
                                                                capture="environment"
                                                                onChange={handlePhotoChange}
                                                                required
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    name="notes"
                                    rows={4}
                                    placeholder="Add any additional notes about this visit..."
                                />
                            </CardContent>
                        </Card>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={loading || !location}
                            className="w-full h-12 text-base"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Log Activity
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
