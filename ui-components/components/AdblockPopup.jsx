
export default function AdblockPopup() {
  return (
    <div className="w-80 bg-base-200 text-base-content p-4 border">
      <header className="mb-4">
        Adblock
      </header>
      <div className="flex items-center gap-2 bg-base-100 rounded mb-3 px-4 py-2 cursor-pointer hover:bg-secondary/70 hover:text-secondary-content">
        <span className="bg-secondary text-secondary-content px-2 py-1 rounded text-sm font-bold">
          New
        </span>
        Block Floating Videos
      </div>
      <main className="bg-base-100 rounded py-4 px-4">
        <div className="text-center font-bold text-xl">
          example.com
        </div>
        <div className="border rounded mt-5 px-2 py-1">
          <div className="py-1">
            Block Ads
          </div>
          <hr/>
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-primary font-semibold">0</span> on this page
            </div>
            <div>
              <span className="text-primary font-semibold">2,267</span> in total
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-between bg-base-200 p-2 mt-2 rounded text-base-content border border-base-300/10">
          Skip Cookie Walls
          <button className="bg-accent text-accent-content px-2 py-1 rounded text-xs font-semibold hover:bg-accent/80 hover:shadow-lg">
            Learn more
          </button>
        </div>
        <div className="flex items-center justify-between bg-base-200 p-2 mt-2 rounded text-base-content border border-base-300/10">
          Block Distractions
          <button className="bg-accent text-accent-content px-2 py-1 rounded text-xs font-semibold hover:bg-accent/80 hover:shadow-lg">
            Learn more
          </button>
        </div>

        <button className="w-full bg-base-200 text-center text-sm font-semibold mt-5 py-2 rounded hover:shadow-lg">
          Pause on this site
        </button>
      </main>
    </div>
  );
}
