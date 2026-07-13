import Sidebar from "@/components/workspace/ClientSidebarWrapper";
import GlobalHeader from "@/components/GlobalHeader";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen kyxun-page">
      <Sidebar />
      {/* Content area shifts right based on sidebar width CSS custom property */}
      <div
        className="flex-1 min-w-0 transition-all duration-300 ease-in-out flex flex-col ml-0 lg:ml-[var(--sidebar-w,260px)]"
      >
        {/* Top Header Bar */}
        <div className="h-16 flex items-center justify-end px-6 sticky top-0 z-40">
          <GlobalHeader />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
