export interface IConnectionConfig {
  rdpFile: string
  freerdpPath: string
  username: string
}

export const isConfigValid: (ic: IConnectionConfig | undefined) => boolean = (ic: IConnectionConfig | undefined): boolean => {
  if (!ic) {
    return false
  }
  return ic.rdpFile.length > 0 && ic.freerdpPath.length > 0 && ic.username.length > 0
}
