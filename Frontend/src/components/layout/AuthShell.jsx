export default function AuthShell({ children, narrow = false }) {
  return (
    <div className="container-fluid auth-shell">
      <div className="row justify-content-center">
        <div className={narrow ? 'col-lg-6 col-xl-5' : 'col-lg-10 col-xl-9'}>
          {children}
        </div>
      </div>
    </div>
  )
}
