<script setup>
import IconFilledClearCircle from '@omnicajs/icons/assets/icons/filled/actions/clear-circle.svg'
import IconOutlinedClearCircle from '@omnicajs/icons/assets/icons/outlined/actions/clear-circle.svg'
</script>

<template>
    <main>
        <img
            data-template-asset="clear-circle-small"
            src="@omnicajs/icons/assets/icons/filled/actions/clear-circle-small.svg"
            alt=""
            width="48"
            height="48"
        >
        <IconFilledClearCircle
            class="imported-icon imported-icon--filled"
            aria-hidden="true"
            data-imported-icon="filled"
            width="48"
            height="48"
            style="color: rgb(0, 122, 204)"
        />
        <IconOutlinedClearCircle
            class="imported-icon imported-icon--outlined"
            aria-label="Outlined clear circle"
            data-imported-icon="outlined"
            role="img"
            width="48"
            height="48"
            style="color: rgb(0, 122, 204)"
        />
    </main>
</template>
