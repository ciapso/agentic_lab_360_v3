import { ReactFlowProvider } from '@xyflow/react';

import SidebarLayout from '@/app/components/layouts/sidebar-layout';
import AppContextMenu from '@/app/components/app-context-menu';
import Workflow from '@/app/components/workflow';

export default async function Design() {
  return (
    <ReactFlowProvider>
      <SidebarLayout>
        <AppContextMenu>
          <Workflow />
        </AppContextMenu>
      </SidebarLayout>
    </ReactFlowProvider>
  );
}