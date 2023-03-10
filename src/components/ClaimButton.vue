<template>
	<div>
		<loader v-if="isLoading" />
		<p v-if="claimed">
			{{
				$t('claimButton.p', {
					allocatedAmount: formatAmount(allocatedAmount!),
					tokenSymbol: tokenSymbol,
				})
			}}
		</p>
		<button v-if="hasClaimBtn() && !claimed" class="btn-action" :disabled="!canClaim()" @click="claim()">
			{{
				$t('claimButton.button', {
					allocatedAmount: formatAmount(allocatedAmount!),
					tokenSymbol: tokenSymbol,
				})
			}}
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { FixedNumber } from 'ethers'

import { getAllocatedAmount, isFundsClaimed } from '@/api/claims'
import type { Project } from '@/api/projects'
import { RoundStatus } from '@/api/round'
import { formatAmount as _formatAmount } from '@/utils/amounts'
import { markdown } from '@/utils/markdown'

import ClaimModal from '@/components/ClaimModal.vue'
import Loader from '@/components/Loader.vue'
import { useAppStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { $vfm } from 'vue-final-modal'

const appStore = useAppStore()
const { currentRound, tally, isRoundFinalized } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

interface Props {
	project: Project
}

const props = defineProps<Props>()

const allocatedAmount = ref<FixedNumber | null>(null)
const claimed = ref<boolean | null>(null)
const isLoading = ref(true)

const descriptionHtml = computed(() => markdown.render(props.project.description || ''))
const tokenSymbol = computed(() => {
	return currentRound.value?.nativeTokenSymbol ?? ''
})

onMounted(() => {
	checkAllocation()
})

watch(currentRound, () => {
	checkAllocation()
})

async function checkAllocation() {
	// If the current round is not finalized or the allocated amount was already
	// fetched then don't do anything
	// eslint-disable-next-line
	if (!props.project || !currentRound.value || !isRoundFinalized.value || allocatedAmount.value) {
		isLoading.value = false
		return
	}

	isLoading.value = true
	if (!tally.value) {
		// @todo add timeout
		await appStore.loadTally()
	}

	allocatedAmount.value = await getAllocatedAmount(
		currentRound.value.fundingRoundAddress,
		currentRound.value.nativeTokenDecimals,
		tally.value!.results.tally[props.project.index],
		tally.value!.totalVoiceCreditsPerVoteOption.tally[props.project.index],
	)
	claimed.value = await isFundsClaimed(currentRound.value.fundingRoundAddress, props.project.address)
	isLoading.value = false
}

function hasClaimBtn(): boolean {
	return (
		!!currentRound.value &&
		currentRound.value.status === RoundStatus.Finalized &&
		// eslint-disable-next-line
		props.project !== null &&
		props.project.index !== 0 &&
		!props.project.isHidden &&
		allocatedAmount.value !== null &&
		claimed.value !== null
	)
}

function canClaim(): boolean {
	return hasClaimBtn() && !!currentUser.value && !claimed.value
}

function formatAmount(value: FixedNumber): string {
	const maxDecimals = 6
	const { nativeTokenDecimals } = currentRound.value!
	return _formatAmount(value, nativeTokenDecimals, null, maxDecimals)
}

function claim() {
	$vfm.show({
		component: ClaimModal,
		bind: {
			project: props.project,
			claimed: () => {
				// Optimistically update the claimed state
				claimed.value = true
			},
		},
		on: {
			close(closeModal) {
				closeModal()
			},
		},
	})
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';
</style>
