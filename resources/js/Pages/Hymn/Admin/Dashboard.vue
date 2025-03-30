<script setup>
import { onMounted } from 'vue';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-moment';

const props = defineProps({
    total_users: Object,
    total_uploaded_hymns_count: Number,
    total_accepted_hymns_count: Number,
    total_clicks: Number,
    total_declined_hymns_count: Number,
    uploaded_hymns_data: Array,
    accepted_hymns_data: Array,
    declined_hymns_data: Array,
});

let hymnsChart = null;

function drawHymnsChart(data, label) {
    const ctx = document.getElementById('hymns_trendline').getContext('2d');
    if (hymnsChart) hymnsChart.destroy();

    hymnsChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                data: data,
                label: label,
                backgroundColor: '#1e90ff',
                borderColor: '#1e90ff',
                fill: false,
            }],
        },
        options: {
            scales: {
                y: { title: { display: true, text: label } },
                x: { type: 'time', time: { unit: 'day' } },
            },
        },
    });
}

const changeChartData = () => {
    const hymnsType = document.getElementById('hymns_type').value;
    if (hymnsType === 'uploaded_hymns') {
        drawHymnsChart(props.uploaded_hymns_data, 'Uploaded hymns');
    } else if (hymnsType === 'accepted_hymns') {
        drawHymnsChart(props.accepted_hymns_data, 'Accepted hymns');
    } else if (hymnsType === 'declined_hymns') {
        drawHymnsChart(props.declined_hymns_data, 'Declined hymns');
    }
};

onMounted(() => {
    drawHymnsChart(props.uploaded_hymns_data, 'Uploaded hymns');
});
</script>

<template>

    <Head title="Admin Dashboard" />
    <div class="container-fluid py-3">
        <div class="card p-3">
            <div class="row">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-danger elevation-1"><i class="fas fa-microphone-lines"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">{{ total_uploaded_hymns_count }}</span>
                            <span class="info-box-text">Total uploaded hymns</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-success elevation-1"><i
                                class="fas fa-microphone-lines"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">{{ total_accepted_hymns_count }}</span>
                            <span class="info-box-text">Total accepted hymns</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-warning elevation-1"><i class="fas fa-mouse-pointer"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">{{ total_clicks }}</span>
                            <span class="info-box-text">Total clicks</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-info elevation-1"><i class="fas fa-user"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">{{ total_users.length }}</span>
                            <span class="info-box-text">Total users</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="row">
                    <div class="col-7">
                        <h4 class="font-weight-normal">Trendline of Hymns</h4>
                    </div>
                    <div class="col-4 text-right">
                        <select id="hymns_type" name="hymns_type" @input="changeChartData" class="form-control">
                            <option value="">Select category</option>
                            <option value="uploaded_hymns">Uploaded hymns</option>
                            <option value="accepted_hymns">Accepted hymns</option>
                            <option value="declined_hymns">Declined hymns</option>
                        </select>
                    </div>
                    <div class="col-1 text-right">
                        <button type="button" class="btn btn-tool" data-card-widget="collapse">
                            <i class="fas fa-minus"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <canvas id="hymns_trendline"></canvas>
            </div>
        </div>
    </div>
</template>

<script>
import AdminLayout from '@/Layouts/Hymn/AdminLayout.vue';
export default { layout: AdminLayout };
</script>