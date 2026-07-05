import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "服務條款",
  description: "Tomo 家教媒合平台服務條款：帳號規範、媒合機制、評價規範、費用、責任限制與帳號終止。",
};

// ponytail: 法務完稿前仍請律師覆核（同 privacy/page.tsx）。
const CONTACT_EMAIL = "tomoocustomer@gmail.com";
const UPDATED_AT = "2026-07-05";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-ink">
      <h1 className="font-serif text-3xl font-extrabold">服務條款</h1>
      <p className="mt-2 text-sm text-ink/60">最後更新：{UPDATED_AT}</p>

      <p className="mt-6 leading-relaxed text-ink/80">
        歡迎使用 Tomo（以下稱「本平台」）。本平台提供家教媒合服務，當您註冊帳號或使用本平台，
        即表示您已閱讀、理解並同意本服務條款。個人資料之處理另見
        <Link href="/privacy" className="mx-1 underline hover:text-ink">
          隱私權政策
        </Link>
        。
      </p>

      <Section title="一、服務內容">
        <p>
          本平台提供家教需求刊登、老師檔案刊登、媒合配對、站內訊息、討論區與雙向評價等功能。
          本平台為<strong>媒合平台</strong>，非家教服務之提供者，亦非任何一方之代理人；
          實際授課內容、時間、地點與報酬，由學生／家長與老師雙方自行約定。
        </p>
      </Section>

      <Section title="二、帳號註冊與管理">
        <ul className="list-disc space-y-1 pl-5">
          <li>您應提供真實、正確之註冊資料，並妥善保管帳號密碼；帳號不得轉讓、出借或共用。</li>
          <li>未滿十八歲者，應由法定代理人閱讀並同意本條款後始得使用。</li>
          <li>以帳號進行之一切行為，視為帳號持有人之行為。發現帳號遭盜用請立即聯絡我們。</li>
        </ul>
      </Section>

      <Section title="三、使用規範">
        <p>您同意不從事下列行為，違者本平台得移除內容、限制或終止帳號：</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>刊登不實、誤導、冒用他人身分之資訊（含不實學經歷與認證文件）</li>
          <li>發送騷擾、詐騙、廣告垃圾訊息，或蒐集其他使用者之個人資料</li>
          <li>刊登違反法令或公序良俗之內容</li>
          <li>以自動化程式異常存取、干擾或破壞本平台服務</li>
          <li>繞過本平台進行惡意行為，或利用平台從事任何違法交易</li>
        </ul>
      </Section>

      <Section title="四、媒合與費用">
        <ul className="list-disc space-y-1 pl-5">
          <li>本平台目前<strong>免費</strong>提供媒合服務；未來若調整收費方式，將於生效前公告。</li>
          <li>授課報酬由雙方自行議定與給付，本平台不經手金流，亦不對雙方之履約負擔保責任。</li>
          <li>「實名認證」等信任徽章僅表示相關文件通過本平台形式審查，不構成對使用者之保證。</li>
        </ul>
      </Section>

      <Section title="五、評價規範">
        <ul className="list-disc space-y-1 pl-5">
          <li>評價功能限於<strong>曾實際完成媒合</strong>之雙方互評，應基於真實互動經驗撰寫。</li>
          <li>不得以評價進行威脅、勒索、報復，或刊登與教學互動無關之內容。</li>
          <li>
            本平台得移除違反本條或第三條之評價；除此之外，本平台不介入、不代為修改評價內容，
            亦不保證評價之正確性。
          </li>
        </ul>
      </Section>

      <Section title="六、內容與智慧財產權">
        <ul className="list-disc space-y-1 pl-5">
          <li>您於本平台刊登之內容（檔案、發文、評價等）仍屬您所有；您授權本平台為提供服務之目的展示該內容。</li>
          <li>本平台之網站設計、程式與商標屬本平台所有，未經同意不得重製或使用。</li>
        </ul>
      </Section>

      <Section title="七、通知方式">
        <p>
          本平台之正式通知以<strong>站內通知</strong>及<strong>您註冊的 Email</strong> 為之，
          發送至該 Email 即視為已送達。請保持 Email 有效並留意收信（含垃圾郵件匣）；
          您可於帳號設定調整非必要通知之接收偏好。
        </p>
      </Section>

      <Section title="八、服務變更與中止">
        <ul className="list-disc space-y-1 pl-5">
          <li>本平台得因功能調整、系統維護或不可抗力，暫停或變更全部或部分服務；重大變更將於網站公告。</li>
          <li>本平台若決定終止營運，將於合理期間前公告，供您備份或處理帳號資料。</li>
        </ul>
      </Section>

      <Section title="九、責任限制">
        <ul className="list-disc space-y-1 pl-5">
          <li>本平台就使用者間之互動（含授課品質、報酬給付、人身安全）不負擔保責任；請於見面前自行確認對方身分。</li>
          <li>本平台以「現狀」提供服務，不保證服務不中斷或無錯誤；因系統維護、第三方服務中斷所生之損害，於法令允許範圍內本平台不負賠償責任。</li>
        </ul>
      </Section>

      <Section title="十、檢舉與申訴">
        <p>
          發現違規內容（不實檔案、騷擾訊息、不當評價等），請來信檢舉並附上相關頁面連結或截圖；
          本平台將於合理期間內查處並回覆。對本平台之處置有異議，亦得循同一管道申訴。
        </p>
      </Section>

      <Section title="十一、帳號終止">
        <p>
          您得隨時停止使用並聯絡我們刪除帳號。若您違反本條款或法令，本平台得暫停或終止您的帳號，
          且就已刊登之違規內容得逕行移除。
        </p>
      </Section>

      <Section title="十二、其他">
        <ul className="list-disc space-y-1 pl-5">
          <li>本平台得修訂本條款，重大變更將於網站公告；公告後繼續使用即視為同意修訂後之條款。</li>
          <li>本條款任一條文經認定無效或無法執行時，不影響其餘條文之效力。</li>
          <li>本條款以中華民國法律為準據法；因本條款所生爭議，以臺灣臺北地方法院為第一審管轄法院。</li>
        </ul>
      </Section>

      <Section title="十三、聯絡方式">
        <p>
          對本條款有任何疑問，或欲檢舉、申訴，請來信：
          <a href={`mailto:${CONTACT_EMAIL}`} className="ml-1 underline hover:text-ink">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-xl font-bold text-ink">{title}</h2>
      <div className="mt-2 text-ink/80">{children}</div>
    </section>
  );
}
