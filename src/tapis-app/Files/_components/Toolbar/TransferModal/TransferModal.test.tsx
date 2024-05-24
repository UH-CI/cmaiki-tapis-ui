import { renderComponent } from '@tapis/tapisui-common';;
import TransferModal from './TransferModal';
import { TransferListing, TransferCreate } from '@tapis/tapisui-common';
import { FileExplorer } from '@tapis/tapisui-common';
import { useFilesSelect } from 'tapis-app/Files/_components/FilesContext';
import { fileInfo } from 'fixtures/files.fixtures';

jest.mock('@tapis/tapisui-common');
jest.mock('tapis-app/Files/_components/FilesContext');

describe('TransferModal', () => {
  it('renders the transfer modal', async () => {
    (FileExplorer as jest.Mock).mockReturnValue(<div>Mock File Explorer</div>);
    (TransferListing as jest.Mock).mockReturnValue(
      <div>Mock Transfer listing</div>
    );
    (TransferCreate as jest.Mock).mockReturnValue(
      <div>Mock Transfer Create</div>
    );

    (useFilesSelect as jest.Mock).mockReturnValue({
      selectedFiles: [fileInfo],
    });

    renderComponent(
      <TransferModal toggle={() => {}} systemId={'system-id'} path={'/'} />
    );

    expect(FileExplorer).toHaveBeenCalled();
    expect(TransferListing).toHaveBeenCalled();
    expect(TransferCreate).toHaveBeenCalled();
  });
});
