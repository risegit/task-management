export default function CapsuleGridMarquee({ items, speed = 20 }) {

    
  return (
   <div className="capsule-marquee">
  <div
    className="capsule-marquee__track"
    style={{ animationDuration: `${speed}s` }}
  >
    <div className="capsule-marquee__grid">
      {items?.map((item, index) => (
        <div className="capsule" key={index}>
          ⚠️ {item.employeeName} has {parseInt(item.count_tasks) || 0} Pending Tasks
        </div>
      ))}
    </div>
  </div>
</div>

  );
}