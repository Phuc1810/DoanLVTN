export default function AuthShell({ children, narrow = false }) {
  return (
    <div className="container auth-shell">
      <div className="row justify-content-center">
        <div className={narrow ? 'col-lg-7 col-xl-6' : 'col-lg-9 col-xl-8'}>
          {children}
        </div>
      </div>
    </div>
  )
}
