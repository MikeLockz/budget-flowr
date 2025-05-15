import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useRouter } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Lazy load import components for better performance
const ImportData = lazy(() => import("./import-data"));
const ImportHistory = lazy(() => import("./import-history"));

function Import() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isHistory = pathname.includes("/history");
  const defaultTab = isHistory ? "history" : "import";

  // Handle tab change
  const handleTabChange = (value: string) => {
    if (value === "history") {
      router.navigate({ to: "/import/history" });
    } else {
      router.navigate({ to: "/import" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Import</h2>
      </div>
      
      <Card>
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
          </TabsList>
          
          <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
            <TabsContent value="import" className="p-6">
              <ImportData />
            </TabsContent>
            
            <TabsContent value="history" className="p-6">
              <ImportHistory />
            </TabsContent>
          </Suspense>
        </Tabs>
      </Card>
    </div>
  );
}

export default Import;