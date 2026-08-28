import { ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { MockBadge } from "@/components/MockBadge";

export type EntryDocketProps = {
  stage: "epic" | "otp";
  epic: string;
  otp: string;
  error: string | null;
  busy: boolean;
  onEpicChange: (value: string) => void;
  onOtpChange: (value: string) => void;
  onUseDemo: () => void;
  onSendOtp: () => void;
  onEditEpic: () => void;
  onVerify: () => void;
};

export function EntryDocket({
  stage,
  epic,
  otp,
  error,
  busy,
  onEpicChange,
  onOtpChange,
  onUseDemo,
  onSendOtp,
  onEditEpic,
  onVerify,
}: EntryDocketProps) {
  const epicOk = /^ZZK\d{7}$/.test(epic);
  const otpOk = /^\d{6}$/.test(otp);
  const sendOtp = <PrimaryButton disabled={!epicOk} onClick={onSendOtp}>Send OTP</PrimaryButton>;
  const verifyHousehold = <PrimaryButton disabled={!otpOk || busy} onClick={onVerify}>{busy ? "Reading the roll…" : "Check my family"}</PrimaryButton>;

  return (
    <section className="entry-docket record-card" aria-labelledby="entry-title">
      <header className="entry-docket-header">
        <span className="folio">RG / 001</span>
        <span className="entry-docket-status">Household check</span>
      </header>
      <div className="entry-docket-body" aria-live="polite">
        <h2 id="entry-title">{stage === "epic" ? "Start with one voter" : "Verify this household"}</h2>
        {stage === "epic" ? (
          <label className="block">
            <span className="text-sm font-medium">Any one EPIC number from your house</span>
            <input
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              value={epic}
              onChange={(event) => onEpicChange(event.target.value.toUpperCase().replace(/\s/g, ""))}
              placeholder="ZZK1234567"
              className="entry-docket-input mt-1 w-full min-h-[52px] rounded-md border border-ink/30 bg-card px-3 font-mono text-xl tracking-[0.12em] nums placeholder:text-muted/60 transition-[border-color] duration-150"
            />
            <span className="mt-1 block text-xs text-muted">
              We find everyone enrolled at the same house.{" "}
              <button type="button" className="-my-3 inline-flex min-h-11 min-w-11 items-center justify-center underline underline-offset-2 text-violet" onClick={onUseDemo}>
                Use demo EPIC ZZK1400001
              </button>
            </span>
          </label>
        ) : (
          <>
            <div className="entry-docket-epic">
              <span className="text-xs text-muted">EPIC number</span>
              <strong className="font-mono tracking-[0.08em]">{epic}</strong>
              <button type="button" className="hidden min-h-11 min-w-11 items-center justify-center text-sm text-violet underline underline-offset-2 md:inline-flex" onClick={onEditEpic}>Edit EPIC</button>
            </div>
            <label className="block">
              <span className="text-sm font-medium flex items-center gap-2">
                OTP sent to the mobile linked to this EPIC <MockBadge label="mock · any 6 digits" />
              </span>
              <input
                inputMode="numeric"
                autoFocus
                value={otp}
                onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••••"
                className="entry-docket-input mt-1 w-full min-h-[52px] rounded-md border border-ink/30 bg-card px-3 font-mono text-2xl tracking-[0.4em]"
              />
            </label>
          </>
        )}
        {error && <p role="alert" className="rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">{error}</p>}
        <div className="docket-desktop-action">
          {stage === "epic" ? sendOtp : verifyHousehold}
        </div>
      </div>
      <div className="docket-mobile-action">
        <ActionBar width="workspace">
          {stage === "epic" ? sendOtp : <><SecondaryButton onClick={onEditEpic}>Edit EPIC</SecondaryButton>{verifyHousehold}</>}
        </ActionBar>
      </div>
    </section>
  );
}
