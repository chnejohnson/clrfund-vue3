@ -0,0 +1,36 @@
<template>
	<div>
		<round-status-banner v-if="currentRound" />
		<loader v-if="loading" />
		<div v-if="!loading">
			<div class="gradient">
				<img src="@/assets/moon.png" class="moon" />
				<div class="hero">
					<image-responsive title="newrings" />
				</div>
			</div>
			<div class="content">
				<breadcrumbs />
				<div class="flex-title">
					<h1>Prove you’re only using one account</h1>
				</div>
				<div class="subtitle">
					We use BrightID to stop bots and cheaters, and make our funding more democratic.
				</div>
				<h2>
					What you'll need
					<img
						v-tooltip="{
							content: `If you've previously donated to a CLR round, use the same wallet to bypass some BrightID steps`,
							triggers: ['hover', 'click'],
						}"
						width="16"
						src="@/assets/info.svg"
						class="info-icon"
					/>
				</h2>
				<ul>
					<li>
						BrightID – available on
						<a href="https://apps.apple.com/us/app/brightid/id1428946820" target="_blank"> iOS</a>
						or
						<a href="https://play.google.com/store/apps/details?id=org.brightid" target="_blank">Android</a>
						<ul>
							<li><links to="/brightid/sponsor">Get sponsored</links></li>
							<li><links to="/brightid">Get verified</links></li>
						</ul>
					</li>
					<li>An Ethereum wallet, with enough gas for two transactions</li>
					<li>Access to Zoom or Google Meet</li>
				</ul>
				<links to="/about/sybil-resistance">Why is this important?</links>
				<div v-if="!hasRoundStarted" class="join-message">
					There's not yet an open funding round. Please check back later.
				</div>
				<div v-else-if="isRoundOver" class="warning-message">
					The current round is no longer accepting new contributions. Please try again next round.
				</div>
				<div v-else-if="isRoundFull" class="warning-message">
					Contributions closed early – you can no longer donate! Due to the community's generosity and some
					technical constraints we had to close the round earlier than expected. If you already contributed,
					you still have time to reallocate if you need to. If you didn't get a chance to contribute, you can
					still help by donating to the matching pool
				</div>
				<div class="btn-container mt2">
					<div v-if="!isRoundOver">
						<wallet-widget v-if="!currentUser" :is-action-button="true" :full-width-mobile="true" />
						<links v-if="showBrightIdButton" to="/verify/connect" class="btn-primary">
							I have BrightID installed
						</links>
					</div>
					<links to="/projects" class="btn-secondary">Go back</links>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import humanizeDuration from 'humanize-duration'
import { commify, formatUnits } from '@ethersproject/units'

import { getCurrentRound } from '@/api/round'

import Breadcrumbs from '@/components/Breadcrumbs.vue'
import Links from '@/components/Links.vue'
import Loader from '@/components/Loader.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import RoundStatusBanner from '@/components/RoundStatusBanner.vue'
import WalletWidget from '@/components/WalletWidget.vue'
import ImageResponsive from '@/components/ImageResponsive.vue'
import { useAppStore, useUserStore } from '@/stores'

const appStore = useAppStore()
const { isRoundContributorLimitReached, hasContributionPhaseEnded } = storeToRefs(appStore)
const userStore = useUserStore()
const { currentUser } = storeToRefs(userStore)

const loading = ref(true)
const currentRound = ref<string | null>(null)

onMounted(async () => {
	currentRound.value = await getCurrentRound()
	loading.value = false
})

const balance = computed<string | null>(() => {
	const balance = currentUser.value?.balance
	if (balance === null || typeof balance === 'undefined') {
		return null
	}
	return commify(formatUnits(balance, 18))
})
const hasRoundStarted = computed(() => !!currentRound.value)
const isRoundFull = computed(() => isRoundContributorLimitReached.value)
const isRoundOver = computed(() => hasContributionPhaseEnded.value)
const showBrightIdButton = computed(() => currentUser.value?.isRegistered === false)

function formatDuration(value: number): string {
	return humanizeDuration(value * 1000, { largest: 1 })
}
</script>

<style scoped lang="scss">
@import '../styles/vars';
@import '../styles/theme';

.emoji {
	font-size: 40px;
}

h1 {
	font-family: Glacial Indifference;
	font-style: normal;
	font-weight: bold;
	font-size: 40px;
	line-height: 120%;
}

h2 {
	font-family: 'Glacial Indifference', sans-serif;
	font-weight: bold;
	font-size: 24px;
	letter-spacing: -0.015em;
}

p {
	font-size: 16px;
	line-height: 30px;
}

li {
	font-size: 16px;
	line-height: 30px;
}

ul {
	padding-left: 1.5rem;
}

.gradient {
	background: var(--bg-gradient);
	position: fixed;
	top: 0;
	right: 0;
	height: 100%;
	width: 100%;

	.moon {
		position: absolute;
		top: 1rem;
		right: 1rem;
		mix-blend-mode: exclusion;
	}
	.hero {
		display: flex;
		position: fixed;
		top: 0;
		right: 0;
		height: 100%;
		width: 100%;
		background: var(--bg-gradient-hero);
		@media (max-width: $breakpoint-m) {
			padding: 2rem 0rem;
			padding-bottom: 0rem;
		}

		img {
			position: absolute;
			bottom: 0;
			right: 0;
			mix-blend-mode: exclusion;
			width: 66%;
			@media (max-width: $breakpoint-m) {
				right: 0;
				width: 100%;
			}
		}
	}
}
.content {
	position: relative;
	z-index: 1;
	padding: $content-space;
	width: min(100%, 512px);
	margin: 2rem;
	box-sizing: border-box;
	@media (max-width: $breakpoint-m) {
		width: 100%;
		margin: 0;
		padding-bottom: 35vw;
	}

	@media (max-width: $breakpoint-s) {
		@include gradientBackground(
			171.34deg,
			rgba(var(--shadow-dark-rgb), 0.8),
			63.5%,
			rgba(var(--shadow-light-rgb), 0),
			78.75%
		);
	}

	.flex-title {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;

		img {
			width: 1rem;
			height: 1rem;
			position: relative;
			right: 0;
		}
	}
}

.subtitle {
	font-size: 1.25rem;
	margin-bottom: 1.5rem;
}

.icon {
	width: 1rem;
	height: 1rem;
	position: relative;
}

.join-message {
	border: 1px solid $clr-green;
	background: var(--bg-primary-color);
	border-radius: 1rem;
	padding: 1rem;
	margin: 1rem 0 0;
	color: $clr-green;
	font-size: 14px;
}

.warning-message {
	border: 1px solid var(--error-color);
	background: var(--bg-primary-color);
	border-radius: 1rem;
	padding: 1rem;
	margin: 1rem 0 0;
	color: var(--error-color);
	font-size: 14px;
}

.info-icon {
	margin-left: 0.5rem;
}
</style>
