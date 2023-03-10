import { getEtherBalance, getTokenBalance, isVerifiedUser, type User } from '@/api/user'
import { defineStore } from 'pinia'
import { loginUser, logoutUser } from '@/api/gun'
import { useAppStore } from './app'
import { getContributionAmount, hasContributorVoted } from '@/api/contributions'
import type { BigNumber } from 'ethers'
import { ensLookup } from '@/utils/addresses'
import { UserRegistryType, userRegistryType } from '@/api/core'
import { getBrightId, type BrightId } from '@/api/bright-id'

export type UserState = {
	currentUser: User | null
}

export const useUserStore = defineStore('user', {
	state: (): UserState => ({
		currentUser: null,
	}),
	getters: {},
	actions: {
		setCurrentUser(user: User) {
			this.currentUser = user
		},
		async loginUser(walletAddress: string, encryptionKey: string) {
			await loginUser(walletAddress, encryptionKey)
		},
		logoutUser() {
			const appStore = useAppStore()
			appStore.unwatchCart()
			appStore.unwatchContributorData()
			logoutUser()
			this.currentUser = null
			appStore.contribution = null
			appStore.contributor = null
			appStore.cart = []
		},
		// @note redesign this function
		async loadUserInfo() {
			const appStore = useAppStore()

			if (!this.currentUser) {
				return
			}

			let nativeTokenAddress = ''
			let userRegistryAddress = ''
			let balance: BigNumber | null = null

			if (!appStore.factory) {
				try {
					await appStore.loadFactoryInfo()
				} catch (err: any) {
					throw new Error(err)
				}
			}
			nativeTokenAddress = appStore.factory!.nativeTokenAddress
			userRegistryAddress = appStore.factory!.userRegistryAddress

			if (appStore.currentRound) {
				console.log('currentRound', appStore.currentRound)

				nativeTokenAddress = appStore.currentRound.nativeTokenAddress
				userRegistryAddress = appStore.currentRound.userRegistryAddress

				let contribution = appStore.contribution
				if (!contribution || contribution.isZero()) {
					try {
						contribution = await getContributionAmount(
							appStore.currentRound.fundingRoundAddress,
							this.currentUser.walletAddress,
						)
					} catch (err: any) {
						throw new Error(err)
					}

					let hasVoted
					try {
						hasVoted = await hasContributorVoted(
							appStore.currentRound.fundingRoundAddress,
							this.currentUser.walletAddress,
						)
					} catch (err: any) {
						throw new Error(err)
					}

					appStore.contribution = contribution
					appStore.hasVoted = hasVoted
				}
			}

			// Check if this user is in our user registry
			const isRegistered = await isVerifiedUser(userRegistryAddress, this.currentUser.walletAddress)

			if (nativeTokenAddress) {
				try {
					balance = await getTokenBalance(nativeTokenAddress, this.currentUser.walletAddress)
				} catch (err: any) {
					throw new Error(err)
				}
			}

			let etherBalance
			try {
				etherBalance = await getEtherBalance(this.currentUser.walletAddress)
			} catch (err: any) {
				throw new Error(err)
			}

			let ensName: string | null | undefined = this.currentUser.ensName

			try {
				ensName = await ensLookup(this.currentUser.walletAddress)
			} catch (err: any) {
				throw new Error(err)
			}

			this.currentUser = {
				...this.currentUser,
				isRegistered,
				balance,
				etherBalance,
				ensName,
			}
		},
		async loadBrightID() {
			if (this.currentUser && userRegistryType === UserRegistryType.BRIGHT_ID) {
				// If the user is registered, we assume all brightId steps as done
				let brightId: BrightId = {
					isVerified: true,
				}

				if (!this.currentUser.isRegistered) {
					// If not registered, then fetch brightId data
					brightId = await getBrightId(this.currentUser.walletAddress)
				}

				this.setCurrentUser({
					...this.currentUser,
					brightId,
				})
			}
		},
	},
})
