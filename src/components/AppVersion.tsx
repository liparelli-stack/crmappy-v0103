const APP_VERSION = 'v0102';
const BUILD_DATE = '3003';
const GIT_SHA = '318ab2c';

export function AppVersion() {
  return (
    <div className="text-[10.5px] text-light-t3 dark:text-dark-t3 font-mono tracking-wide">
      CRMAppy {APP_VERSION}m{BUILD_DATE} · {GIT_SHA}
    </div>
  );
}
