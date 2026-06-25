export default function AccountRoleSelect({ value, disabled, onChange }) {
  return (
    <select className="admin-select" value={value || 'KH'} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="AD">AD</option>
      <option value="NV">NV</option>
      <option value="KH">KH</option>
    </select>
  )
}
