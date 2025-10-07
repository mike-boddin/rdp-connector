export interface IConnectionConfig {
  rdpFile: string
  freerdpPath: string
  username: string
  connectionParams: string[]
}

export const isConfigValid: (ic: IConnectionConfig | undefined) => boolean = (ic: IConnectionConfig | undefined): boolean => {
  if (!ic) {
    return false;
  }
  return ic.rdpFile.length > 0 && ic.freerdpPath.length > 0;
};

export const printConfig: (ic: IConnectionConfig | undefined) => string = (ic: IConnectionConfig | undefined): string => {
  return ic ? `RDP File: ${ic.rdpFile} \nPath To FreeRDP: ${ic.freerdpPath} \nUsername: ${ic.username} \nAdditional ConnectionParams: ${ic.connectionParams.join(' ')}` : 'no config loaded';
};
