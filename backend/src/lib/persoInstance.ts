import type { Perso } from '@teknokeras/perso-sdk'

let instance: Perso | null = null

export function setPerso(p: Perso): void {
    instance = p
}

export function getPerso(): Perso | null {
    return instance
}

export function isPersoReady(): boolean {
    return instance !== null
}