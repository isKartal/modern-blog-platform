import django_filters
from .models import Post, Comment

class PostFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    content = django_filters.CharFilter(lookup_expr='icontains')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    author_username = django_filters.CharFilter(field_name='author__username', lookup_expr='icontains')
    
    class Meta:
        model = Post
        fields = {
            'status': ['exact'],
            'category': ['exact'],
            'author': ['exact'],
        }

class CommentFilter(django_filters.FilterSet):
    content = django_filters.CharFilter(lookup_expr='icontains')
    author_username = django_filters.CharFilter(field_name='author__username', lookup_expr='icontains')
    
    class Meta:
        model = Comment
        fields = {
            'is_approved': ['exact'],
            'post': ['exact'],
        }