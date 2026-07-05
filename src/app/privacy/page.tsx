import type { Metadata } from "next";
import Link from "next/link";
import BackLink from "@/components/BackLink";

export const metadata: Metadata = {
  title: "隱私權政策與個資蒐集告知",
  description:
    "Tomo 依《個人資料保護法》告知個人資料之蒐集目的、類別、利用方式、保存期限與當事人權利。",
};

// ponytail: 法務完稿前仍請律師覆核；內容與程式現況一致——
// 證件影像審核後即刪（admin/actions.ts）、GA4 為 env 開關（layout.tsx）、
// Email 通知偏好可關（dashboard/account）。
const CONTACT_EMAIL = "tomoocustomer@gmail.com";
const UPDATED_AT = "2026-07-05";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-ink">
      <h1 className="font-serif text-3xl font-extrabold">隱私權政策與個資蒐集告知</h1>
      <p className="mt-2 text-sm text-ink/60">最後更新：{UPDATED_AT}</p>

      <p className="mt-6 leading-relaxed text-ink/80">
        Tomo（以下稱「本平台」）為家教媒合服務。我們依《個人資料保護法》（下稱「個資法」）及相關法令，
        蒐集、處理及利用您的個人資料。請於註冊或使用服務前詳閱本政策；當您勾選同意並完成註冊，
        即表示您已知悉並同意以下內容。服務使用規範另見
        <Link href="/terms" className="mx-1 underline hover:text-ink">
          服務條款
        </Link>
        。
      </p>

      <Section title="一、蒐集目的">
        <ul className="list-disc space-y-1 pl-5">
          <li>提供家教媒合、刊登需求與接案、訊息聯繫、互相評價等核心服務</li>
          <li>身分與資格驗證（例如老師之學歷／身分證明審核）</li>
          <li>寄送與服務相關之通知（新應徵、媒合結果、新訊息、審核結果）</li>
          <li>帳號管理、客服處理、爭議與申訴處理</li>
          <li>網站安全維護、防止濫用與不法使用（如登入速率限制）</li>
          <li>以彙總、去識別化方式進行流量統計與服務改善</li>
        </ul>
      </Section>

      <Section title="二、蒐集之個人資料類別">
        <ul className="list-disc space-y-1 pl-5">
          <li>識別與聯絡資料：姓名、Email、性別</li>
          <li>帳號資料：加密後的密碼（本平台不保存明文密碼）、通知偏好設定</li>
          <li>
            個人檔案：公開顯示名稱（本名或化名）、頭像、自我介紹、可教科目／學制／地區、
            學歷、收費等老師自願填寫之資料
          </li>
          <li>驗證文件：為審核身分／學歷而上傳之證件影像（處理方式見第五節）</li>
          <li>服務使用資料：發案內容、應徵訊息、站內訊息、討論區發文與回覆、評價</li>
          <li>技術紀錄：IP 位址、登入與操作的必要紀錄（用於安全維護）</li>
        </ul>
      </Section>

      <Section title="三、不提供資料之影響">
        <p className="leading-relaxed">
          您可自由選擇是否提供個人資料。惟姓名、Email、密碼為註冊之必要資料，若不提供將無法建立帳號；
          老師檔案、驗證文件等為使用對應功能（刊登檔案、取得信任徽章）所必要，不提供僅影響該功能之使用，
          不影響其他服務。
        </p>
      </Section>

      <Section title="四、利用期間、地區、對象及方式">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>期間：</strong>自您同意起至您刪除帳號或本平台停止服務為止，及法令要求之保存期間。
          </li>
          <li>
            <strong>地區：</strong>本平台託管於雲端服務，資料可能儲存於服務商營運所在地之資料中心。
          </li>
          <li>
            <strong>對象：</strong>本平台，及為提供服務所必要之下列雲端服務商：
            Vercel（網站託管與匿名流量分析）、Neon（資料庫）、Google
            Gmail（Email 通知寄送）、Google Analytics（啟用時之流量統計，見第六節）；
            以及依法令或主管機關要求之對象。本平台<strong>不會</strong>
            將您的個人資料販售或提供給未經授權之第三方做行銷使用。
          </li>
          <li>
            <strong>方式：</strong>透過本平台之網站功能，於蒐集目的之必要範圍內處理與利用。
            老師公開檔案依您設定的公開狀態呈現給其他使用者；討論區發文可選擇匿名顯示。
            服務通知以 Email 寄送，您可隨時於「帳號與安全 → 通知設定」關閉
            （安全性通知如密碼重設信除外）。
          </li>
        </ul>
      </Section>

      <Section title="五、證件影像保存期限（最小化）">
        <p className="leading-relaxed">
          您為通過驗證上傳的證件影像，<strong>僅供管理員審核之用</strong>。一旦管理員完成審核
          （通過或退回），系統即<strong>立即刪除該影像檔</strong>，不做長期保存——平台僅保留「已驗證」之
          狀態結果，而非證件本身。此為個資最小化原則之實作，亦降低資料外洩風險。
        </p>
      </Section>

      <Section title="六、Cookie 與類似技術">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>必要 Cookie：</strong>維持登入狀態之工作階段 Cookie。為提供服務所必需，
            停用將無法正常登入。
          </li>
          <li>
            <strong>功能性儲存：</strong>使用瀏覽器 localStorage 記錄您已讀取 Cookie
            告知等偏好，不含個人識別資料。
          </li>
          <li>
            <strong>流量分析：</strong>使用 Vercel Analytics 之無 Cookie 匿名流量統計。
            若本平台啟用 Google Analytics 4，其將設置分析用
            Cookie（如 _ga），用於彙總之流量統計，不用於跨站廣告追蹤；
            您可透過瀏覽器設定或 Google 提供之工具停用。
          </li>
        </ul>
      </Section>

      <Section title="七、當事人權利（個資法第 3 條）">
        <p className="leading-relaxed">您就本平台保有之個人資料，得行使下列權利：</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>查詢、請求閱覽</li>
          <li>請求製給複製本</li>
          <li>請求補充或更正（多數可於帳號設定自行修改）</li>
          <li>請求停止蒐集、處理或利用</li>
          <li>請求刪除（刪除帳號）</li>
        </ul>
        <p className="mt-2 leading-relaxed">
          行使權利請來信下方聯絡窗口。查詢、閱覽或製給複製本之請求，本平台將於 15 日內處理；
          補充、更正、停止利用或刪除之請求，將於 30 日內處理（有正當理由者得依法延長，並以書面通知）。
          部分資料若刪除將導致無法繼續提供服務，或本平台依法令須保存者，得不予刪除並向您說明理由。
        </p>
      </Section>

      <Section title="八、資料安全維護">
        <p className="leading-relaxed">
          本平台採取合理之技術與管理措施保護個人資料，包括：密碼以雜湊方式儲存、全站 HTTPS 傳輸加密、
          登入與註冊速率限制以防暴力破解、資料庫最小權限存取，以及證件影像審核後立即刪除等。
        </p>
      </Section>

      <Section title="九、未滿一定年齡之使用">
        <p className="leading-relaxed">
          未成年人使用本平台，應於法定代理人同意下為之。若您為學生／家長，請確保提供之資料已取得必要同意。
        </p>
      </Section>

      <Section title="十、政策修訂">
        <p className="leading-relaxed">
          本政策將因應法令或服務調整而修訂，修訂後將於本頁公告並更新「最後更新」日期。
          重大變更時，本平台將以適當方式（如站內通知或 Email）通知。
        </p>
      </Section>

      <Section title="十一、聯絡窗口">
        <p className="leading-relaxed">
          如對本政策或個人資料之處理有任何疑問，或欲行使前述權利，請來信：
          <br />
          <span className="font-medium">個資聯絡窗口：</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-cobalt hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>

      <div className="mt-10 border-t border-line pt-6">
        <BackLink href="/register">返回註冊</BackLink>
      </div>
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
