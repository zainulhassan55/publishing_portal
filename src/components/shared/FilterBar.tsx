type FilterBarProps = {
  items: string[]
}

function FilterBar({ items }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          className={`btn btn-sm ${index === 0 ? 'btn-primary' : 'btn-secondary'}`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export default FilterBar
