import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "隱私權政策與個資蒐集告知 ・ Tomo",
  description:
    "Tomo 依《個人資料保護法》告知個人資料之蒐集目的、類別、利用方式、保存期限與當事人權利。",
};

// ponytail: 法務初稿，上線前請律師覆核。
// 內容與程式現況一致：證件影像於審核後立即刪除（見 admin/actions.ts）。
const CONTACT_EMAIL = "tomoocustomer@gmail.com";
const UPDATED_AT = "2026-06-27";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-ink">
      <h1 className="font-serif text-3xl font-extrabold">隱私權政策與個資蒐集告知</h1>
      <p className="mt-2 text-sm text-ink/60">最後更新：{UPDATED_AT}</p>

      <p className="mt-6 leading-relaxed text-ink/80">
        Tomo（以下稱「本平台」）為家教媒合服務。我們依《個人資料保護法》（下稱「個資法」）及相關法令，
        蒐集、處理及利用您的個人資料。請於註冊或使用服務前詳閱本政策；當您勾選同意並完成註冊，
        即表示您已知悉並同意以下內容。
      </p>

      <Section title="一、蒐集目的">
        <ul className="list-disc space-y-1 pl-5">
          <li>提供家教媒合、刊登需求與接案、訊息聯繫、互相評價等核心服務</li>
          <li>身分與資格驗證（例如老師之學歷／身分證明審核）</li>
          <li>帳號管理、客服處理、爭議與申訴處理</li>
          <li>網站安全維護、防止濫用與不法使用（如登入速率限制）</li>
        </ul>
      </Section>

      <Section title="二、蒐集之個人資料類別">
        <ul className="list-disc space-y-1 pl-5">
          <li>識別與聯絡資料：姓名、Email、性別</li>
          <li>帳號資料：加密後的密碼（本平台不保存明文密碼）</li>
          <li>個人檔案：自我介紹、可教科目／學制／地區、學歷、收費等老師自願填寫之資料</li>
          <li>驗證文件：為審核身分／學歷而上傳之證件影像（處理方式見第四節）</li>
          <li>服務使用資料：發案內容、應徵訊息、站內訊息、評價</li>
          <li>技術紀錄：IP 位址、登入與操作的必要紀錄（用於安全維護）</li>
        </ul>
      </Section>

      <Section title="三、利用期間、地區、對象及方式">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>期間：</strong>自您同意起至您刪除帳號或本平台停止服務為止，及法令要求之保存期間。
          </li>
          <li>
            <strong>地區：</strong>本平台託管於雲端服務（Vercel／Neon），資料可能儲存於其營運所在地之資料中心。
          </li>
          <li>
            <strong>對象：</strong>本平台、為提供服務所必要之雲端服務商，以及依法令或主管機關要求之對象。
            本平台<strong>不會</strong>將您的個人資料販售或提供給未經授權之第三方做行銷使用。
          </li>
          <li>
            <strong>方式：</strong>透過本平台之網站功能，於蒐集目的之必要範圍內處理與利用；
            部分公開檔案（如老師之公開檔案頁）將依您設定的公開狀態呈現給其他使用者。
          </li>
        </ul>
      </Section>

      <Section title="四、證件影像保存期限（最小化）">
        <p className="leading-relaxed">
          您為通過驗證上傳的證件影像，<strong>僅供管理員審核之用</strong>。一旦管理員完成審核
          （通過或退回），系統即<strong>立即刪除該影像檔</strong>，不做長期保存——平台僅保留「已驗證」之
          狀態結果，而非證件本身。此為個資最小化原則之實作，亦降低資料外洩風險。
        </p>
      </Section>

      <Section title="五、Cookie 與必要技術">
        <p className="leading-relaxed">
          本平台使用維持登入狀態所必要的 Cookie（登入工作階段）。這類 Cookie 為提供服務所必需，
          停用將無法正常登入。我們可能使用彙總、不可識別個人的流量分析以改善服務。
        </p>
      </Section>

      <Section title="六、當事人權利（個資法第 3 條）">
        <p className="leading-relaxed">您就本平台保有之個人資料，得行使下列權利：</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>查詢、請求閱覽</li>
          <li>請求製給複製本</li>
          <li>請求補充或更正（多數可於帳號設定自行修改）</li>
          <li>請求停止蒐集、處理或利用</li>
          <li>請求刪除（刪除帳號）</li>
        </ul>
        <p className="mt-2 leading-relaxed">
          行使權利請來信下方聯絡窗口。請注意，部分資料若刪除將導致無法繼續提供服務，或本平台依法令須保存者，
          得不予刪除並向您說明。
        </p>
      </Section>

      <Section title="七、資料安全維護">
        <p className="leading-relaxed">
          本平台採取合理之技術與管理措施保護個人資料，包括：密碼以雜湊方式儲存、全站 HTTPS 傳輸加密、
          登入與註冊速率限制以防暴力破解、資料庫最小權限存取，以及證件影像審核後立即刪除等。
        </p>
      </Section>

      <Section title="八、未滿一定年齡之使用">
        <p className="leading-relaxed">
          未成年人使用本平台，應於法定代理人同意下為之。若您為學生／家長，請確保提供之資料已取得必要同意。
        </p>
      </Section>

      <Section title="九、政策修訂">
        <p className="leading-relaxed">
          本政策將因應法令或服務調整而修訂，修訂後將於本頁公告並更新「最後更新」日期。
          重大變更時，本平台將以適當方式通知。
        </p>
      </Section>

      <Section title="十、聯絡窗口">
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
        <Link href="/register" className="text-sm font-medium text-cobalt hover:underline">
          ← 返回註冊
        </Link>
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
