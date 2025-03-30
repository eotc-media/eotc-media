<template>
    <div class="loader-overlay">
        <div class="loader-spinner"></div>
    </div>
</template>
  
<style scoped>
.loader-overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50px;
    /* Adjust the height as needed */
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loader-spinner {
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    width: 30px;
    /* Adjust the size of the spinner */
    height: 30px;
    /* Adjust the size of the spinner */
    animation: spin 1.5s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}
</style>
  