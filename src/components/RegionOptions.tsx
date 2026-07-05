import { TW_REGIONS, ONLINE_REGION, districtValue } from "@/lib/regions";

// 單選 <select> 用的地區選項：線上 + 各縣市 optgroup（含「全縣市」與各行政區）。
// 放在 <select> 的 placeholder <option> 之後即可。
export default function RegionOptions() {
  return (
    <>
      <option value={ONLINE_REGION}>{ONLINE_REGION}</option>
      {TW_REGIONS.map(({ city, districts }) => (
        <optgroup key={city} label={city}>
          <option value={city}>全 {city}</option>
          {districts.map((d) => (
            <option key={d} value={districtValue(city, d)}>
              {d}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
