import React, { useState } from 'react';
import { css } from 'emotion';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { GrafanaTheme } from '@grafana/data';
import { Button, stylesFactory, useStyles } from '@grafana/ui';
import { PanelModel } from 'app/features/dashboard/state';
import { AddLibraryPanelModal } from '../AddLibraryPanelModal/AddLibraryPanelModal';
import { LibraryPanelsView } from '../LibraryPanelsView/LibraryPanelsView';
import { PanelQueriesChangedEvent } from 'app/types/events';
import { LibraryPanelDTO } from '../../types';
import { toPanelModelLibraryPanel } from '../../utils';
import { useDispatch } from 'react-redux';
import { changePanelPlugin } from 'app/features/dashboard/state/actions';
import { getDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';

interface Props {
  panel: PanelModel;
}

export const PanelLibraryOptionsGroup: React.FC<Props> = ({ panel }) => {
  const styles = useStyles(getStyles);
  const [showingAddPanelModal, setShowingAddPanelModal] = useState(false);
  const dashboard = getDashboardSrv().getCurrent();
  const dispatch = useDispatch();

  const useLibraryPanel = (panelInfo: LibraryPanelDTO) => {
    const panelTypeChanged = panel.type !== panelInfo.model.type;
    panel.restoreModel({
      ...omit(panelInfo.model, 'type'),
      ...pick(panel, 'gridPos', 'id'),
      libraryPanel: toPanelModelLibraryPanel(panelInfo),
    });

    if (panelTypeChanged) {
      dispatch(changePanelPlugin(panel, panelInfo.model.type));
    }

    // Though the panel model has changed, since we're switching to an existing
    // library panel, we reset the "hasChanged" state.
    panel.hasChanged = false;
    panel.refresh();
    panel.events.publish(PanelQueriesChangedEvent);
  };

  const onAddToPanelLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setShowingAddPanelModal(true);
  };

  return (
    <div className={styles.box}>
      {!panel.libraryPanel && (
        <div className={styles.addButtonWrapper}>
          <Button size="sm" onClick={onAddToPanelLibrary}>
            Add current panel to library
          </Button>
        </div>
      )}

      <LibraryPanelsView
        formatDate={(dateString: string) => dashboard.formatDate(dateString, 'L')}
        currentPanelId={panel.libraryPanel?.uid}
        showSecondaryActions
      >
        {(panel) => (
          <Button variant="secondary" onClick={() => useLibraryPanel(panel)}>
            Use instead of current panel
          </Button>
        )}
      </LibraryPanelsView>

      {showingAddPanelModal && (
        <AddLibraryPanelModal
          panel={panel}
          onDismiss={() => setShowingAddPanelModal(false)}
          initialFolderId={dashboard.meta.folderId}
          isOpen={showingAddPanelModal}
        />
      )}
    </div>
  );
};

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    box: css`
      background: ${theme.colors.bg1};
      border: 1px solid ${theme.colors.border1};
      padding: ${theme.spacing.sm};
    `,
    addButtonWrapper: css`
      padding: ${theme.spacing.sm};
      text-align: center;
    `,
    panelLibraryTitle: css`
      display: flex;
      gap: 10px;
    `,
  };
});
