export interface UserInfo {
  name: string
  age: string
  town: string
  gender?: string
  hairColor?: string
  hairStyle?: string
  color?: string
  food?: string
  hobby?: string
}

export type ImageStyle = 'pixar' | 'pixelart' | 'superhero' | 'lego' | 'stickerpack' | 'disney'

export interface GeneratedImage {
  imageUrl: string
  style: ImageStyle
}

