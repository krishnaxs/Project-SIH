"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  TrendingUp,
  Truck,
  BarChart3,
  MapPin,
  Sprout,
  Loader2,
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpRight,
} from "lucide-react";


export default function DemandForecastPage() {
  const router = useRouter();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayString = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [state, setState] = useState("Uttar Pradesh");
  const [crop, setCrop] = useState("Tomato");

  const [forecastType, setForecastType] = useState("date");

  const [selectedDate, setSelectedDate] = useState(todayString);

  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(currentMonth));

  const [numberOfMonths, setNumberOfMonths] = useState("3");


  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [forecastCache, setForecastCache] = useState({});


  const states = [
    "Uttar Pradesh",
    "Maharashtra",
    "Punjab",
    "Haryana",
    "Rajasthan",
    "Madhya Pradesh",
    "Karnataka",
    "Tamil Nadu",
  ];


  const crops = [
    "Tomato",
    "Onion",
    "Potato",
  ];


  const months = [
    { value: "1", name: "January" },
    { value: "2", name: "February" },
    { value: "3", name: "March" },
    { value: "4", name: "April" },
    { value: "5", name: "May" },
    { value: "6", name: "June" },
    { value: "7", name: "July" },
    { value: "8", name: "August" },
    { value: "9", name: "September" },
    { value: "10", name: "October" },
    { value: "11", name: "November" },
  ];

  const availableYears = [2026, 2027, 2028, 2029, 2030].filter((y) => y >= currentYear);

  // Filter out previous months when the selected year is the current year
  const availableMonths = months.filter((item) => {
    const selectedYearInt = parseInt(year, 10);
    if (selectedYearInt === currentYear) {
      return parseInt(item.value, 10) >= currentMonth;
    }
    return true;
  });

  const handleYearChange = (newYear) => {
    setYear(newYear);
    const newYearInt = parseInt(newYear, 10);
    if (newYearInt === currentYear && parseInt(month, 10) < currentMonth) {
      setMonth(String(currentMonth));
    }
  };

  const handleSubmit = async () => {

    setError("");


    if (forecastType === "date" && !selectedDate) {

      setError("Please select a forecast date.");
      return;

    }


    if (
      (forecastType === "month" ||
        forecastType === "multiple") &&
      !month
    ) {

      setError("Please select a month.");
      return;

    }

    let cacheKey = "";
    if (forecastType === "date") {
      cacheKey = `date_${selectedDate}`;
    } else if (forecastType === "month") {
      cacheKey = `month_${year}_${month}`;
    } else if (forecastType === "multiple") {
      cacheKey = `months_${year}_${month}_${numberOfMonths}`;
    }

    // Instant return if already fetched during this session
    if (cacheKey && forecastCache[cacheKey]) {
      setResult(forecastCache[cacheKey]);
      return;
    }

    setResult(null);
    setLoading(true);


    try {

      let url = "";
      if (forecastType === "date") {
        url = `/api/forecast?date=${selectedDate}`;
      } else if (forecastType === "month") {
        url = `/api/forecast/month?year=${year}&month=${month}`;
      } else if (forecastType === "multiple") {
        url = `/api/forecast/months?year=${year}&month=${month}&months=${numberOfMonths}`;
      }

      const response = await fetch(url);

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned status ${response.status}`);
      }

      if (!response.ok) {
        const errorMsg =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
            ? data.detail.map((d) => d.msg).join(", ")
            : data?.message || "Unable to generate forecast.";

        throw new Error(errorMsg);
      }




      setResult(data);
      if (cacheKey) {
        setForecastCache((prev) => ({
          ...prev,
          [cacheKey]: data,
        }));
      }

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="min-h-screen bg-gray-50">


      {/* HEADER */}

      <div className="border-b border-gray-200 bg-white">

        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">

          <button
            onClick={() => router.push("/farmer/dashboard")}
            className="mb-6 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">

                  <TrendingUp
                    size={23}
                    className="text-green-600"
                  />

                </div>


                <div>

                  <h1 className="text-3xl font-bold text-gray-900">

                    Demand Forecast

                  </h1>


                  <p className="mt-1 text-gray-500">

                    AI-powered agricultural market forecasting

                  </p>

                </div>

              </div>

            </div>


            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">

              Uttar Pradesh • Tomato Forecast

            </div>

          </div>

        </div>

      </div>


      <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">


        {/* FORECAST CONFIGURATION */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">


          <div className="border-b border-gray-100 px-6 py-5">

            <h2 className="text-xl font-semibold text-gray-900">

              Forecast Configuration

            </h2>


            <p className="mt-1 text-sm text-gray-500">

              Configure the market and forecast period.

            </p>

          </div>


          <div className="p-6 md:p-8">


            {/* FORECAST TYPE BUTTONS */}

            <div className="mb-8">

              <label className="mb-3 block text-sm font-semibold text-gray-700">

                Forecast Type

              </label>


              <div className="grid gap-3 md:grid-cols-3">


                {/* DATE */}

                <button

                  onClick={() => {

                    setForecastType("date");
                    setResult(null);

                  }}

                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                    forecastType === "date"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}

                >

                  <div className={`rounded-lg p-2 ${
                    forecastType === "date"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>

                    <CalendarDays size={20} />

                  </div>


                  <div>

                    <p className="font-semibold text-gray-800">

                      Specific Date

                    </p>


                    <p className="text-xs text-gray-500">

                      Forecast for one day

                    </p>

                  </div>

                </button>


                {/* MONTH */}

                <button

                  onClick={() => {

                    setForecastType("month");
                    setResult(null);

                  }}

                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                    forecastType === "month"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}

                >

                  <div className={`rounded-lg p-2 ${
                    forecastType === "month"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>

                    <Calendar size={20} />

                  </div>


                  <div>

                    <p className="font-semibold text-gray-800">

                      Single Month

                    </p>


                    <p className="text-xs text-gray-500">

                      Monthly average forecast

                    </p>

                  </div>

                </button>


                {/* MULTIPLE */}

                <button

                  onClick={() => {

                    setForecastType("multiple");
                    setResult(null);

                  }}

                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                    forecastType === "multiple"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                  }`}

                >

                  <div className={`rounded-lg p-2 ${
                    forecastType === "multiple"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>

                    <Layers size={20} />

                  </div>


                  <div>

                    <p className="font-semibold text-gray-800">

                      Multiple Months

                    </p>


                    <p className="text-xs text-gray-500">

                      Long-term forecast

                    </p>

                  </div>

                </button>

              </div>

            </div>


            {/* FORM */}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">


              {/* STATE */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">

                  <MapPin size={16} />

                  State

                </label>


                <select

                  value={state}

                  onChange={(e) =>
                    setState(e.target.value)
                  }

                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                >

                  {states.map((item) => (

                    <option

                      key={item}

                      value={item}

                      disabled={item !== "Uttar Pradesh"}

                    >

                      {item}

                      {item !== "Uttar Pradesh"
                        ? " (Coming Soon)"
                        : ""}

                    </option>

                  ))}

                </select>

              </div>


              {/* CROP */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">

                  <Sprout size={16} />

                  Crop

                </label>


                <select

                  value={crop}

                  onChange={(e) =>
                    setCrop(e.target.value)
                  }

                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-green-600 text-gray-900 focus:ring-2 focus:ring-green-100"

                >

                  {crops.map((item) => (

                    <option

                      key={item}

                      value={item}

                      disabled={item !== "Tomato"}

                    >

                      {item}

                      {item !== "Tomato"
                        ? " (Coming Soon)"
                        : ""}

                    </option>

                  ))}

                </select>

              </div>


              {/* DATE */}

              {forecastType === "date" && (

                <div>

                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">

                    <CalendarDays size={16} />

                    Forecast Date

                  </label>


                  <input
                    type="date"
                    min={todayString}
                    value={selectedDate}
                    onChange={(e) =>
                      setSelectedDate(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 opacity-100 outline-none transition [color-scheme:light] focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />

                </div>

              )}


              {/* YEAR */}

              {forecastType !== "date" && (

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">

                    Year

                  </label>


                  <select
                    value={year}
                    onChange={(e) =>
                      handleYearChange(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    {availableYears.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>


                </div>

              )}


              {/* MONTH */}

              {forecastType !== "date" && (

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">

                    Starting Month

                  </label>


                  <select
                    value={month}
                    onChange={(e) =>
                      setMonth(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition [color-scheme:light] focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    {availableMonths.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>


                </div>

              )}


              {/* NUMBER OF MONTHS */}

              {forecastType === "multiple" && (

                <div>

                  <label className="mb-2 block text-sm font-medium text-gray-700">

                    Number of Months

                  </label>


                  <select

                    value={numberOfMonths}

                    onChange={(e) =>
                      setNumberOfMonths(
                        e.target.value
                      )
                    }

                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >

                    <option value="2">
                      2 Months
                    </option>

                    <option value="3">
                      3 Months
                    </option>

                    <option value="6">
                      6 Months
                    </option>

                    <option value="12">
                      12 Months
                    </option>

                  </select>

                </div>

              )}

            </div>


            {/* BUTTON */}

            <div className="mt-8 flex items-center gap-4">

              <button

                onClick={handleSubmit}

                disabled={loading}

                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"

              >

                {loading ? (

                  <>

                    <Loader2
                      size={19}
                      className="animate-spin"
                    />

                    Generating Forecast...

                  </>

                ) : (

                  <>

                    <TrendingUp size={19} />

                    Generate Forecast

                  </>

                )}

              </button>

            </div>


            {/* ERROR */}

            {error && (

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                <AlertCircle size={18} />

                {error}

              </div>

            )}

          </div>

        </div>


        {/* RESULTS */}

        {result && (

          <div className="mt-10">


            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold text-gray-900">

                  Forecast Results

                </h2>


                <p className="mt-1 text-sm text-gray-500">

                  AI-generated market predictions

                </p>

              </div>


              <div className="hidden items-center gap-2 text-sm text-gray-500 md:flex">

                <ArrowUpRight size={16} />

                Forecast Generated

              </div>

            </div>


            {/* DATE RESULT */}

            {forecastType === "date" && (

              <div className="grid gap-5 md:grid-cols-3">


                {/* PRICE */}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div className="rounded-xl bg-green-100 p-3 text-green-600">

                      <TrendingUp size={22} />

                    </div>

                  </div>


                  <p className="mt-5 text-sm font-medium text-gray-500">

                    Expected Price

                  </p>


                  <h3 className="mt-2 text-3xl font-bold text-gray-900">

                    ₹{result.predicted_price}

                  </h3>

                </div>


                {/* ARRIVALS */}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="rounded-xl bg-blue-100 p-3 text-blue-600 w-fit">

                    <Truck size={22} />

                  </div>


                  <p className="mt-5 text-sm font-medium text-gray-500">

                    Expected Arrivals

                  </p>


                  <h3 className="mt-2 text-3xl font-bold text-gray-900">

                    {result.predicted_arrivals}

                  </h3>

                </div>


                {/* DEMAND */}

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                  <div className="rounded-xl bg-purple-100 p-3 text-purple-600 w-fit">

                    <BarChart3 size={22} />

                  </div>


                  <p className="mt-5 text-sm font-medium text-gray-500">

                    Demand Score

                  </p>


                  <h3 className="mt-2 text-3xl font-bold text-gray-900">

                    {result.demand_score}%

                  </h3>


                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">

                    <div

                      className="h-full rounded-full bg-green-600"

                      style={{
                        width: `${Math.min(
                          result.demand_score,
                          100
                        )}%`
                      }}

                    />

                  </div>

                </div>

              </div>

            )}


            {/* MONTH RESULTS */}

            {forecastType !== "date" && (

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">


                <div className="border-b border-gray-100 px-6 py-5">

                  <h3 className="font-semibold text-gray-900">

                    Monthly Forecast Overview

                  </h3>

                </div>


                <div className="overflow-x-auto">

                  <table className="w-full text-left">


                    <thead className="bg-gray-50 text-sm text-gray-600">

                      <tr>

                        <th className="px-6 py-4 font-semibold">

                          Forecast Period

                        </th>

                        <th className="px-6 py-4 font-semibold">

                          Expected Price (per quintal)

                        </th>

                        <th className="px-6 py-4 font-semibold">

                          Expected Arrivals (in quintals)

                        </th>

                        <th className="px-6 py-4 font-semibold">

                          Demand Score

                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {(Array.isArray(result)
                        ? result
                        : [result]
                      ).map((item, index) => (

                        <tr

                          key={index}

                          className="border-t border-gray-100 transition hover:bg-gray-50"

                        >

                          <td className="px-6 py-5 font-semibold text-gray-900">

                            {item.month} {item.year}

                          </td>


                          <td className="px-6 py-5 font-medium text-gray-800">

                            ₹{item.average_price}

                          </td>


                          <td className="px-6 py-5 text-gray-700">

                            {item.average_arrivals}

                          </td>


                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <span className="font-semibold text-gray-800">

                                {item.average_demand}%

                              </span>


                              <div className="hidden h-2 w-20 overflow-hidden rounded-full bg-gray-100 sm:block">

                                <div

                                  className="h-full rounded-full bg-green-600"

                                  style={{
                                    width: `${Math.min(
                                      item.average_demand,
                                      100
                                    )}%`
                                  }}

                                />

                              </div>

                            </div>

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </div>

        )}

      </div>

    </div>

  );

}