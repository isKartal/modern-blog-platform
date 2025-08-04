from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Post, Comment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']

class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    
    class Meta:
        model = Comment
        fields = ['id', 'content', 'author', 'created_at', 'is_approved']
        read_only_fields = ['author', 'created_at', 'is_approved']

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False)
    comments = CommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()  # YENİ ALAN
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'image', 'image_url', 'status', 'author', 'category', 
                 'category_id', 'comments', 'comments_count', 'created_at', 'updated_at']
    
    def get_comments_count(self, obj):
        return obj.comments.filter(is_approved=True).count()
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)