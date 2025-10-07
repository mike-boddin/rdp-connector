export interface ListItem<T = any> extends InternalItem<T> {
  title?: string;
  props: {
    [key: string]: any
    title?: string
    value?: any
  }
  children?: ListItem<T>[]
  type?: string
}

export interface InternalItem<T = any> {
  value?: any
  raw?: T
  type?: string
}
