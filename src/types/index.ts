export interface UserInfo {
  name: string
  age: string
  town: string
  color?: string
  food?: string
  hobby?: string
}

export type ImageStyle = 'cartoon' | 'fairytale' | 'superhero' | 'lego' | 'fantasy'

export interface GeneratedImage {
  imageUrl: string
  style: ImageStyle
}

