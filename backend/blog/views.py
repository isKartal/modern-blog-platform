from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Category, Post, Comment
from .serializers import CategorySerializer, PostSerializer, CommentSerializer
from .filters import PostFilter, CommentFilter

# Custom JWT serializer
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Token'a kullanıcı bilgileri ekle
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# Kayıt view'ı
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    # Basit validasyon
    if not username or not email or not password:
        return Response({
            'error': 'Username, email ve password gerekli'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({
            'error': 'Bu kullanıcı adı zaten alınmış'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Bu email zaten kayıtlı'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Kullanıcı oluştur
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )
    
    return Response({
        'message': 'Kullanıcı başarıyla oluşturuldu',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
    }, status=status.HTTP_201_CREATED)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()  # Bu satırı ekle
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PostFilter
    search_fields = ['title', 'content', 'author__username']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Post.objects.select_related('author', 'category').prefetch_related('comments')
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='published')
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Kullanıcının kendi postları"""
        if request.user.is_authenticated:
            posts = Post.objects.filter(author=request.user).select_related('category').prefetch_related('comments')
            
            # Pagination uygula
            page = self.paginate_queryset(posts)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(posts, many=True)
            return Response(serializer.data)
        return Response({'error': 'Giriş yapmalısınız'}, status=401)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """En çok yorumlanan postlar"""
        from django.db.models import Count
        
        posts = Post.objects.filter(status='published').annotate(
            comment_count=Count('comments')
        ).order_by('-comment_count')[:10]
        
        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """Posta yorum ekle"""
        post = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Yorum içeriği gerekli'}, status=400)
        
        comment = Comment.objects.create(
            post=post,
            author=request.user,
            content=content
        )
        
        serializer = CommentSerializer(comment)
        return Response(serializer.data, status=201)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """Postun yorumlarını getir"""
        post = self.get_object()
        comments = post.comments.filter(is_approved=True).select_related('author')
        
        # Pagination uygula
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = CommentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()  # Bu satırı ekle
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CommentFilter
    search_fields = ['content', 'author__username']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Comment.objects.filter(is_approved=True).select_related('author', 'post')
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)