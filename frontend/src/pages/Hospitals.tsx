import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  Flame,
  Star,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Building2,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { api } from '../services/api';
import { Hospital } from '../types';

export const Hospitals: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const fetchHospitals = async (
    lat?: number,
    lng?: number,
    query?: string,
    type?: string
  ) => {
    setLoading(true);
    try {
      const data = await api.getHospitals({
        latitude: lat,
        longitude: lng,
        query: query || undefined,
        type: type !== 'all' ? type : undefined,
      });

      setHospitals(data.hospitals || []);
      if (data.locationName) {
        setLocationName(data.locationName);
      }
    } catch (err: any) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please search by city name below.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationName('Your Current GPS Location');
        fetchHospitals(latitude, longitude, undefined, selectedType);
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. You can still search for any city or area using the search bar below.');
        } else {
          setGeoError('Could not retrieve your location. Please enter your city or area manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchHospitals(
        userLocation?.lat,
        userLocation?.lng,
        searchQuery.trim(),
        selectedType
      );
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    fetchHospitals(
      userLocation?.lat,
      userLocation?.lng,
      searchQuery.trim() || undefined,
      type
    );
  };

  useEffect(() => {
    // Initial fetch for default metro directory
    fetchHospitals(17.4065, 78.4772, undefined, 'all');
  }, []);

  const openDirections = (h: Hospital) => {
    const query = encodeURIComponent(`${h.name}, ${h.address}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Nearby Hospitals & Medical Facilities
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-500" />
              Live Locator
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Locate 24/7 trauma centers, hospitals, clinics, and pharmacies near your location or anywhere globally.
          </p>
        </div>

        {/* Locate Me Button */}
        <button
          onClick={handleUseLocation}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-medical-600 hover:bg-medical-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Navigation className="w-4 h-4" />
          <span>Use My Current Location</span>
        </button>
      </div>

      {/* Geolocation Notice / Denial Banner */}
      {geoError && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-900 dark:text-white mb-0.5">Location Access Note</p>
            <p>{geoError}</p>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city (e.g. Hyderabad, Mumbai, Bengaluru, New York) or hospital name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search Location'}
          </button>
        </form>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter Type:</span>
          {[
            { id: 'all', label: 'All Facilities', icon: Building2 },
            { id: 'emergency', label: '24/7 Emergency', icon: Flame },
            { id: 'hospital', label: 'Hospitals', icon: Building2 },
            { id: 'clinic', label: 'Clinics', icon: Stethoscope },
            { id: 'pharmacy', label: 'Pharmacies', icon: Pill },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTypeChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? 'bg-medical-50 text-medical-700 dark:bg-medical-950 dark:text-medical-300 font-semibold border border-medical-200 dark:border-medical-800'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-medical-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <strong>{hospitals.length}</strong> medical facilities
          {locationName && <span> near <strong className="text-slate-800 dark:text-slate-200">{locationName}</strong></span>}
        </div>
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-pulse"
            >
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : hospitals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No medical facilities found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for a different city, neighborhood, or resetting your filter category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {hosp.type}
                  </span>
                  {hosp.emergency && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                      <Flame className="w-3 h-3" />
                      24/7 ER
                    </span>
                  )}
                </div>

                {/* Name & Address */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {hosp.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-medical-600" />
                    <span>{hosp.address}</span>
                  </p>
                </div>

                {/* Metrics: Distance, Rating, Open */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {hosp.distance !== undefined && (
                    <span className="font-semibold text-medical-700 dark:text-medical-300 bg-medical-50 dark:bg-medical-950/60 px-2 py-0.5 rounded">
                      {hosp.distance} km away
                    </span>
                  )}
                  {hosp.rating && (
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {hosp.rating}
                    </span>
                  )}
                  {hosp.openNow !== undefined && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Open Now
                    </span>
                  )}
                </div>

                {/* Specialities pills */}
                {hosp.specialities && hosp.specialities.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {hosp.specialities.slice(0, 3).map((spec, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-medical-600" />
                  <span>Call Clinic</span>
                </a>
                <button
                  onClick={() => openDirections(hosp)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-medical-600 hover:bg-medical-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  <span>Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
