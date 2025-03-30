<script setup>
import { onMounted, computed } from 'vue'
import 'moment'
import 'chartjs-adapter-moment'
import Chart from 'chart.js/auto'
const props = defineProps({
    total_uploaded_books: Object,
    total_users: Object
})
const total_accepted_books = computed(() => props.total_uploaded_books.filter((book) => book.approval_status_id == 2))
const total_unreviewed_books = computed(() => props.total_uploaded_books.filter((book) => book.approval_status_id == 1))
const total_declined_books = computed(() => props.total_uploaded_books.filter((book) => book.approval_status_id == 3))

const uploaded_books_data = props.total_uploaded_books.map((book) => {
    const date = new Date(book.created_at).getTime()
    return ({
        'x': book.created_at,
        'y': props.total_uploaded_books.filter((filtered_book) => new Date(filtered_book.created_at).getTime() <= date).length
    })
})
const accepted_books_data = total_accepted_books.value.map((book) => {
    const date = new Date(book.created_at).getTime()
    return ({
        'x': book.created_at,
        'y': total_accepted_books.value.filter((filtered_book) => new Date(filtered_book.created_at).getTime() <= date).length
    })
})
const declined_books_data = total_declined_books.value.map((book) => {
    const date = new Date(book.created_at).getTime()
    return ({
        'x': book.created_at,
        'y': total_declined_books.value.filter((filtered_book) => new Date(filtered_book.created_at).getTime() <= date).length
    })
})

let booksContext
let booksChart
function drawBooksChart(data, label) {
    if (booksChart) booksChart.destroy();
    booksContext = document.getElementById('books_trendline').getContext('2d');
    booksChart = new Chart(booksContext, {
        type: 'line',
        data: {
            datasets: [{
                data: data,
                label: label,
                backgroundColor: '#1e90ff',
                borderColor: '#1e90ff',
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    title: {
                        display: true,
                        text: label
                    }
                },
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    });
}

const changeChartData = () => {
    if (document.getElementById('books_type').value == 'uploaded_books') {
        drawBooksChart(uploaded_books_data, 'Uploaded books')
    } else if (document.getElementById('books_type').value == 'accepted_books') {
        drawBooksChart(accepted_books_data, 'Accepted books')
    } else if (document.getElementById('books_type').value == 'declined_books') {
        drawBooksChart(declined_books_data, 'Declined books')
    }
}

onMounted(() => {
    drawBooksChart(uploaded_books_data, 'Uploaded books')
})
</script>

<script>
import AdminLayout from '@/Layouts/Book/AdminLayout.vue';
export default {
    layout: AdminLayout
}
</script>

<template>

    <Head title="Admin Dashboard" />

    <div class="container-fluid py-3">
        <div class="card p-3">
            <div class="row">
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-danger elevation-1"><i class="fas fa-book-bible"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">
                                {{ total_uploaded_books.length }}
                            </span>
                            <span class="info-box-text">Total uploaded books</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-success elevation-1"><i class="fas fa-book-bible"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">
                                {{ total_accepted_books.length }}
                            </span>
                            <span class="info-box-text">Total accepted books</span>
                        </div>
                    </div>
                </div>
                <div class="col-12 col-sm-6 col-xl-3">
                    <div class="info-box my-1">
                        <span class="info-box-icon bg-warning elevation-1"><i class="fas fa-book-bible"></i></span>
                        <div class="info-box-content">
                            <span class="info-box-number">{{ total_unreviewed_books.length }}</span>
                            <span class="info-box-text">Total unreviewed books</span>
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
                        <h4 class="font-weight-normal">Trendline of Books</h4>
                    </div>
                    <div class="col-4 text-right">
                        <select id="books_type" name="books_type" @input="changeChartData" class="form-control">
                            <option value="">Select category</option>
                            <option value="uploaded_books">Uploaded books</option>
                            <option value="accepted_books">Accepted books</option>
                            <option value="declined_books">Declined books</option>
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
                <canvas id="books_trendline"></canvas>
            </div>
        </div>
    </div>
</template>