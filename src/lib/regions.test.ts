// 地區工具自檢：npx tsx src/lib/regions.test.ts
import assert from "node:assert";
import {
  parentCity,
  districtValue,
  districtValuesOf,
  expandRegions,
  regionsCover,
  regionLabel,
  TW_REGIONS,
} from "./regions";

const daan = districtValue("台北市", "大安區"); // "台北市大安區"

// parentCity：行政區回縣市，縣市與線上回 null
assert.equal(parentCity(daan), "台北市");
assert.equal(parentCity("台北市"), null);
assert.equal(parentCity("線上"), null);

// 同名區靠縣市前綴區分（台北 vs 台中皆有大安區）
assert.equal(parentCity(districtValue("台中市", "大安區")), "台中市");

// expandRegions：選行政區補縣市；選縣市補所有行政區
assert.ok(expandRegions([daan]).includes("台北市"));
const cityExpanded = expandRegions(["台北市"]);
assert.ok(cityExpanded.includes(daan));
assert.equal(cityExpanded.length, districtValuesOf("台北市").length + 1);

// regionsCover：跨層級涵蓋
assert.ok(regionsCover(["台北市"], daan)); // 登記整市 → 涵蓋區查詢
assert.ok(regionsCover([daan], "台北市")); // 登記某區 → 出現在整市查詢
assert.ok(regionsCover([daan], daan)); // 完全相等
assert.ok(!regionsCover([daan], districtValue("台北市", "中正區"))); // 不同區不涵蓋
assert.ok(!regionsCover(["台北市"], "新北市")); // 不同縣市不涵蓋
assert.ok(regionsCover(["線上"], "線上"));

// regionLabel 顯示
assert.equal(regionLabel(daan), "台北市·大安區");
assert.equal(regionLabel("台北市"), "台北市");

// 資料完整性：22 縣市、無重複、無空區
assert.equal(TW_REGIONS.length, 22);
const cities = new Set(TW_REGIONS.map((r) => r.city));
assert.equal(cities.size, 22);
for (const { city, districts } of TW_REGIONS) {
  assert.ok(districts.length > 0, `${city} 無行政區`);
  assert.equal(new Set(districts).size, districts.length, `${city} 有重複區`);
}

console.log("regions.test.ts OK");
