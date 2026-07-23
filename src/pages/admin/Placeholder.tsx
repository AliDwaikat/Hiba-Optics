/** Empty admin section placeholder (CRUD comes in later steps). */
export default function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
      <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-gray-600">هذا القسم قيد الإنشاء.</p>
      </div>
    </div>
  )
}
