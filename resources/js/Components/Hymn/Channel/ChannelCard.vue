<script setup>
defineProps({
    channel: Object,
})
</script>

<template>
    <Link :href="route('hymn.channels.show', channel.slug)">
    <div class="channel-card">
        <div class="card me-lg-3">
            <div class="text-center">
                <img class="mt-4 p-3 rounded-circle" :src="channel.thumbnail_high" alt="">
            </div>
            <div class="card-body mx-2">
                <div class="text-center">
                    <h3 class="text-bold title-small mb-2">
                        {{ channel.title.length > 40 ? channel.title.slice(0, 40) + '...' : channel.title }}
                    </h3>
                    <hr class="mx-5" />
                    <p class="m-0">{{ channel.accepted_hymns_count }} {{ channel.accepted_hymns_count === 1 ? 'መዝሙር' :
                        'መዝሙራት' }} ከዚህ ቻናል</p>
                </div>
            </div>
        </div>
    </div>
    </Link>
</template>

<style scoped>
@media (min-width: 768px) {
    .channel-card .card {
        height: 19rem;
    }
}

.title-small {
    font-size: 1rem;
}

.channel-card img {
    width: 50%;
}

.channel-card h2 {
    margin-bottom: 3rem;
}

.channel-card .card h4 {
    font-family: 'Roboto Condensed', sans-serif;
    font-weight: 700;
}

a {
    text-decoration: none;
    color: #333333;
}

.channel-card .card p {
    font-family: 'Roboto Condensed', sans-serif;
    font-size: 1rem;
}

hr {
    border: none;
    height: 0.5px;
    background-color: rgba(0, 0, 0, 1);
}

.card:hover {
    box-shadow: 0 0 50px rgba(0, 50, 0, 0.2);
    transition: all 0.3s ease-in-out;
}
</style>