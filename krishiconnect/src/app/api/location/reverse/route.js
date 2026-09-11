import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required." },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid coordinates provided." },
        { status: 400 }
      );
    }

    let formattedAddress = "";
    let city = "";
    let state = "";
    let postcode = "";
    let country = "";

    // 1. Try BigDataCloud (fast, highly reliable, zero rate limits)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const bdcRes = await fetch(bdcUrl, { signal: AbortSignal.timeout(3500) });
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        city = bdcData.city || bdcData.locality || "";
        state = bdcData.principalSubdivision || "";
        postcode = bdcData.postcode || "";
        country = bdcData.countryName || "";

        const adminList = bdcData.localityInfo?.administrative || [];
        const districtObj = adminList.find(
          (a) => a.adminLevel === 5 || a.description?.includes("district")
        );
        const district = districtObj?.name || "";

        const parts = [
          bdcData.locality,
          city !== bdcData.locality ? city : null,
          district && district !== city ? district : null,
          state,
          postcode,
          country,
        ].filter(Boolean);

        const uniqueParts = parts.filter((item, i) => parts.indexOf(item) === i);
        if (uniqueParts.length > 0) {
          formattedAddress = uniqueParts.join(", ");
        }
      }
    } catch (bdcErr) {
      console.warn("BigDataCloud geocode failed:", bdcErr?.message);
    }

    // 2. Try OpenStreetMap Nominatim for street/locality details if available
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const nomRes = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "KrishiConnect-App/1.0 (krishiconnect@example.com)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(3500),
      });

      if (nomRes.ok) {
        const data = await nomRes.json();
        const addr = data.address || {};
        const nomParts = [
          addr.suburb || addr.neighbourhood || addr.road,
          addr.city || addr.town || addr.village || addr.county || city,
          addr.state_district,
          addr.state || state,
          addr.postcode || postcode,
          addr.country || country,
        ].filter(Boolean);

        const cleanNom = nomParts.filter((item, i) => nomParts.indexOf(item) === i);
        if (cleanNom.length > 0) {
          formattedAddress = cleanNom.join(", ");
          if (addr.city || addr.town || addr.village) city = addr.city || addr.town || addr.village;
          if (addr.state) state = addr.state;
          if (addr.postcode) postcode = addr.postcode;
          if (addr.country) country = addr.country;
        }
      }
    } catch (nomErr) {
      console.warn("Nominatim geocode failed:", nomErr?.message);
    }

    if (!formattedAddress) {
      formattedAddress = "Current Location (Please enter street address)";
    }

    return NextResponse.json({
      address: formattedAddress,
      city,
      state,
      postcode,
      country,
      latitude,
      longitude,
    });
  } catch (error) {
    console.error("Reverse geocoding error:", error);

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || 0);
    const lng = parseFloat(searchParams.get("lng") || 0);

    return NextResponse.json({
      address: "Current Location (Please enter street address)",
      latitude: lat,
      longitude: lng,
      fallback: true,
    });
  }
}
